import AnnotationModel from '@girder/large_image_annotation/models/AnnotationModel';
import convert from '@girder/large_image_annotation/annotations/convert';
import {wrap} from '@girder/core/utilities/PluginUtils';
import DrawWidget from '@girder/histomicsui/panels/DrawWidget';

// Keep a reference to the original geojson method for fallback
const _geojson = AnnotationModel.prototype.geojson;

/**
 * Convert a single textbox annotation element into a rectangle element with
 * a label.  The `text` field becomes the label value, and the element type
 * is changed to `rectangle` so it can be rendered by the existing GeoJS
 * polygon pipeline in HistomicsUI.
 *
 * @param {object} element - An annotation element object.
 * @returns {object} The (possibly transformed) element.
 */
function convertTextboxElement(element) {
    if (element.type !== 'textbox') {
        return element;
    }
    return Object.assign({}, element, {
        type: 'rectangle',
        // Use the explicit label if present, otherwise fall back to the text
        // field.  If both are absent the rectangle will render without a
        // label, which is intentional – callers should always supply 'text'.
        label: element.label || {value: element.text || ''},
    });
}

/**
 * Override AnnotationModel.prototype.geojson to support the `textbox`
 * annotation element type.  When any textbox elements are present the method
 * converts them to `rectangle` elements with a text label before handing the
 * element list to the standard GeoJSON conversion pipeline so that
 * HistomicsUI renders the bounding box and label without modification.
 *
 * Annotations that contain no textbox elements are handled by the original
 * `geojson` implementation without any extra overhead.
 */
AnnotationModel.prototype.geojson = function () {
    const json = this.get('annotation') || {};
    const elements = json.elements || [];

    if (!elements.some((el) => el.type === 'textbox')) {
        return _geojson.call(this);
    }

    let levels;
    try {
        levels = this.collection._viewer.metadata.levels;
    } catch (err) {
        // no levels available – proceed without
    }

    return convert(
        elements.map(convertTextboxElement),
        {annotation: this.id},
        levels,
    );
};

// ---------------------------------------------------------------------------
// GUI: Add a "Textbox" draw button to the HistomicsUI DrawWidget toolbar.
//
// The button activates the built-in *rectangle* drawing mode.  When the user
// finishes drawing the rectangle a prompt asks for the text content and the
// resulting element is stored as a ``textbox`` annotation element.
// ---------------------------------------------------------------------------

/**
 * Inject a "Textbox" button into the draw-tools toolbar after every render.
 */
wrap(DrawWidget, 'render', function (render) {
    render.call(this);
    if (!this.$('.h-draw-textbox').length) {
        this.$('.h-draw-tools').append(
            '<div class="btn-group btn-group-sm">' +
            '<button class="h-draw h-draw-textbox btn btn-default" type="button" ' +
            'data-type="textbox" title="Draw a new textbox annotation">' +
            '<span class="icon-doc-text"></span>Textbox</button></div>'
        );
    }
    if (this._textboxDrawMode) {
        this.$('button.h-draw[data-type]').removeClass('active');
        this.$('.h-draw-textbox').addClass('active');
    }
    return this;
});

/**
 * Intercept ``drawElement`` so that the custom *textbox* type is mapped to
 * the built-in *rectangle* draw mode while a flag tracks the intent.
 */
wrap(DrawWidget, 'drawElement', function (drawElement, evt, type, forceRefresh) {
    var fromClick = !!evt;
    if (evt) {
        type = this.$(evt.currentTarget).hasClass('active') ? null : this.$(evt.currentTarget).data('type');
        evt = undefined;
    }
    if (type === 'textbox') {
        this._textboxDrawMode = true;
        type = 'rectangle';
    } else if (fromClick) {
        this._textboxDrawMode = false;
    }
    drawElement.call(this, evt, type, forceRefresh);
    if (this._textboxDrawMode) {
        this.$('button.h-draw[data-type]').removeClass('active');
        this.$('.h-draw-textbox').addClass('active');
    }
});

/**
 * After a rectangle is drawn while in textbox mode, prompt the user for the
 * text content and convert the element to a ``textbox`` before it is stored.
 */
wrap(DrawWidget, '_addDrawnElements', function (_addDrawnElements, element, annotations, opts) {
    if (this._textboxDrawMode && element) {
        var text = window.prompt('Enter text for the textbox:');
        if (text === null) {
            // User cancelled – restart drawing without adding the element.
            this.drawElement(undefined, this._drawingType);
            return;
        }
        element = element.map(function (el) {
            return Object.assign({}, el, {
                type: 'textbox',
                text: text || '',
            });
        });
    }
    _addDrawnElements.call(this, element, annotations, opts);
});
