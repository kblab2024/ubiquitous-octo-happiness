"""Tests for the histomicsui_textbox Girder plugin."""
import jsonschema
import pytest


@pytest.fixture(autouse=True)
def reset_annotation_schema():
    """Ensure the textbox schema patch is removed after each test."""
    from girder_large_image_annotation.models.annotation import (
        Annotation,
        AnnotationSchema,
    )

    original_anyof = list(AnnotationSchema.annotationElementSchema['anyOf'])
    original_validator = Annotation.validatorAnnotationElement

    yield

    AnnotationSchema.annotationElementSchema['anyOf'] = original_anyof
    Annotation.validatorAnnotationElement = original_validator


def test_patch_adds_textbox_to_schema():
    """_patch_annotation_schema adds 'textbox' to the element anyOf list."""
    from girder_large_image_annotation.models.annotation import AnnotationSchema

    from histomicsui_textbox import _patch_annotation_schema

    type_enums_before = [
        schema.get('properties', {}).get('type', {}).get('enum', [])
        for schema in AnnotationSchema.annotationElementSchema['anyOf']
    ]
    assert not any('textbox' in e for e in type_enums_before)

    _patch_annotation_schema()

    type_enums_after = [
        schema.get('properties', {}).get('type', {}).get('enum', [])
        for schema in AnnotationSchema.annotationElementSchema['anyOf']
    ]
    assert any('textbox' in e for e in type_enums_after)


def test_patch_is_idempotent():
    """Calling _patch_annotation_schema twice does not add duplicate schemas."""
    from girder_large_image_annotation.models.annotation import AnnotationSchema

    from histomicsui_textbox import _patch_annotation_schema

    _patch_annotation_schema()
    count_after_first = len(AnnotationSchema.annotationElementSchema['anyOf'])

    _patch_annotation_schema()
    count_after_second = len(AnnotationSchema.annotationElementSchema['anyOf'])

    assert count_after_first == count_after_second


def test_valid_textbox_element_passes_validation():
    """A well-formed textbox element passes the updated validator."""
    from girder_large_image_annotation.models.annotation import Annotation

    from histomicsui_textbox import _patch_annotation_schema

    _patch_annotation_schema()

    element = {
        'type': 'textbox',
        'center': [100, 200, 0],
        'width': 50,
        'height': 30,
        'text': 'Hello World',
    }
    # Should not raise
    Annotation.validatorAnnotationElement.validate(element)


def test_textbox_element_with_optional_fields_passes_validation():
    """A textbox element with all optional fields passes validation."""
    from girder_large_image_annotation.models.annotation import Annotation

    from histomicsui_textbox import _patch_annotation_schema

    _patch_annotation_schema()

    element = {
        'type': 'textbox',
        'center': [512, 256, 0],
        'width': 200,
        'height': 80,
        'rotation': 0.5,
        'text': 'Region of interest',
        'fillColor': 'rgba(255, 255, 255, 0)',
        'lineColor': 'rgb(0, 0, 0)',
        'lineWidth': 2,
    }
    Annotation.validatorAnnotationElement.validate(element)


def test_textbox_missing_required_field_fails_validation():
    """A textbox element missing a required field fails validation."""
    from girder_large_image_annotation.models.annotation import Annotation

    from histomicsui_textbox import _patch_annotation_schema

    _patch_annotation_schema()

    # Missing 'width', 'height', and 'text'
    element = {
        'type': 'textbox',
        'center': [100, 200, 0],
    }
    with pytest.raises(jsonschema.ValidationError):
        Annotation.validatorAnnotationElement.validate(element)


def test_textbox_missing_text_field_fails_validation():
    """A textbox element without the required 'text' field fails validation."""
    from girder_large_image_annotation.models.annotation import Annotation

    from histomicsui_textbox import _patch_annotation_schema

    _patch_annotation_schema()

    element = {
        'type': 'textbox',
        'center': [100, 200, 0],
        'width': 50,
        'height': 30,
        # 'text' is missing
    }
    with pytest.raises(jsonschema.ValidationError):
        Annotation.validatorAnnotationElement.validate(element)


def test_rectangle_element_still_passes_validation():
    """Patching the schema does not break existing rectangle validation."""
    from girder_large_image_annotation.models.annotation import Annotation

    from histomicsui_textbox import _patch_annotation_schema

    _patch_annotation_schema()

    element = {
        'type': 'rectangle',
        'center': [100, 200, 0],
        'width': 50,
        'height': 30,
    }
    Annotation.validatorAnnotationElement.validate(element)
