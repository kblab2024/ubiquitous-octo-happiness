import AnnotationModel from '@girder/large_image_annotation/models/AnnotationModel';
import convert from '@girder/large_image_annotation/annotations/convert';
import {wrap} from '@girder/core/utilities/PluginUtils';
import DrawWidget from '@girder/histomicsui/panels/DrawWidget';

// Keep a reference to the original geojson method for fallback
const _geojson = AnnotationModel.prototype.geojson;

/**
 * Convert a single arrow annotation element into a polyline element so
 * that HistomicsUI can render it with the existing GeoJS line pipeline.
 *
 * An arrow element has exactly two points: the tail and the head (tip).
 * After conversion the element becomes a closed: false polyline with
 * those same two points.
 *
 * @param {object} element - An annotation element object.
 * @returns {object} The (possibly transformed) element.
 */
function convertArrowElement(element) {
    if (element.type !== 'arrow') {
        return element;
    }
    return Object.assign({}, element, {
        type: 'polyline',
        closed: false,
    });
}

/**
 * Override AnnotationModel.prototype.geojson to support the `arrow`
 * annotation element type.  When any arrow elements are present the method
 * converts them to `polyline` elements before handing the element list to
 * the standard GeoJSON conversion pipeline so that HistomicsUI renders the
 * line without modification.
 *
 * Annotations that contain no arrow elements are handled by the original
 * `geojson` implementation without any extra overhead.
 */
AnnotationModel.prototype.geojson = function () {
    const json = this.get('annotation') || {};
    const elements = json.elements || [];

    if (!elements.some((el) => el.type === 'arrow')) {
        return _geojson.call(this);
    }

    let levels;
    try {
        levels = this.collection._viewer.metadata.levels;
    } catch (err) {
        // no levels available – proceed without
    }

    return convert(
        elements.map(convertArrowElement),
        {annotation: this.id},
        levels,
    );
};

// ---------------------------------------------------------------------------
// GUI: Add an "Arrow" draw button to the HistomicsUI DrawWidget toolbar.
//
// The button activates the built-in *line* drawing mode.  When the user
// finishes drawing the line, the first and last points are kept and the
// resulting element is stored as an ``arrow`` annotation element.
// ---------------------------------------------------------------------------

/**
 * Inject an "Arrow" button into the draw-tools toolbar after every render.
 */
wrap(DrawWidget, 'render', function (render) {
    render.call(this);
    if (!this.$('.h-draw-arrow').length) {
        this.$('.h-draw-tools').append(
            '<div class="btn-group btn-group-sm">' +
            '<button class="h-draw h-draw-arrow btn btn-default" type="button" ' +
            'data-type="arrow" title="Draw a new arrow annotation">' +
            '<span class="icon-right-open"></span>Arrow</button></div>'
        );
    }
    if (this._arrowDrawMode) {
        this.$('button.h-draw[data-type]').removeClass('active');
        this.$('.h-draw-arrow').addClass('active');
    }
    return this;
});

/**
 * Intercept ``drawElement`` so that the custom *arrow* type is mapped to
 * the built-in *line* draw mode while a flag tracks the intent.
 */
wrap(DrawWidget, 'drawElement', function (drawElement, evt, type, forceRefresh) {
    var fromClick = !!evt;
    if (evt) {
        type = this.$(evt.currentTarget).hasClass('active') ? null : this.$(evt.currentTarget).data('type');
        evt = undefined;
    }
    if (type === 'arrow') {
        this._arrowDrawMode = true;
        type = 'line';
    } else if (fromClick) {
        this._arrowDrawMode = false;
    }
    drawElement.call(this, evt, type, forceRefresh);
    if (this._arrowDrawMode) {
        this.$('button.h-draw[data-type]').removeClass('active');
        this.$('.h-draw-arrow').addClass('active');
    }
});

/**
 * After a line is drawn while in arrow mode, keep only the first and last
 * points and convert the element to an ``arrow`` before it is stored.
 */
wrap(DrawWidget, '_addDrawnElements', function (_addDrawnElements, element, annotations, opts) {
    if (this._arrowDrawMode && element) {
        element = element.map(function (el) {
            var points = el.points || [];
            var arrowEl = Object.assign({}, el, {
                type: 'arrow',
                points: points.length >= 2
                    ? [points[0], points[points.length - 1]]
                    : points,
            });
            delete arrowEl.closed;
            return arrowEl;
        });
    }
    _addDrawnElements.call(this, element, annotations, opts);
});
