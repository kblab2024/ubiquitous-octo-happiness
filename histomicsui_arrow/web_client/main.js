import AnnotationModel from '@girder/large_image_annotation/models/AnnotationModel';
import convert from '@girder/large_image_annotation/annotations/convert';

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
