import AnnotationModel from '@girder/large_image_annotation/models/AnnotationModel';
import convert from '@girder/large_image_annotation/annotations/convert';

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
