import jsonschema
from girder import plugin


def _build_textbox_schema():
    """
    Build the JSON schema for a textbox annotation element using the
    coordinate and colour schemas defined by the installed version of
    girder_large_image_annotation, so our schema stays consistent with
    the rest of the annotation validation.
    """
    from girder_large_image_annotation.models.annotation import AnnotationSchema

    return {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
                'pattern': '^[0-9a-f]{24}$',
            },
            'type': {
                'type': 'string',
                'enum': ['textbox'],
            },
            'user': AnnotationSchema.userSchema,
            'label': AnnotationSchema.labelSchema,
            'group': AnnotationSchema.groupSchema,
            'center': AnnotationSchema.coordSchema,
            'width': {
                'type': 'number',
                'minimum': 0,
            },
            'height': {
                'type': 'number',
                'minimum': 0,
            },
            'rotation': {
                'type': 'number',
                'description': 'radians counterclockwise around normal',
            },
            'normal': AnnotationSchema.coordSchema,
            'fillColor': AnnotationSchema.colorSchema,
            'lineColor': AnnotationSchema.colorSchema,
            'lineWidth': {
                'type': 'number',
                'minimum': 0,
            },
            'text': {
                'type': 'string',
                'description': 'The text content displayed inside the textbox.',
            },
        },
        'required': ['type', 'center', 'width', 'height', 'text'],
        'additionalProperties': False,
    }


def _patch_annotation_schema():
    """Extend the large_image_annotation schema to support textbox elements."""
    from girder_large_image_annotation.models.annotation import (
        Annotation,
        AnnotationSchema,
    )

    # Guard against registering the schema more than once
    for schema in AnnotationSchema.annotationElementSchema.get('anyOf', []):
        type_enum = schema.get('properties', {}).get('type', {}).get('enum', [])
        if 'textbox' in type_enum:
            return

    AnnotationSchema.annotationElementSchema['anyOf'].append(_build_textbox_schema())
    Annotation.validatorAnnotationElement = jsonschema.Draft6Validator(
        AnnotationSchema.annotationElementSchema,
    )


class GirderPlugin(plugin.GirderPlugin):
    DISPLAY_NAME = 'HistomicsUI Textbox Annotation'
    CLIENT_SOURCE_PATH = 'web_client'

    def load(self, info):
        _patch_annotation_schema()
