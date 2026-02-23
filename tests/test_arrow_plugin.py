"""Tests for the histomicsui_arrow Girder plugin.

The ``arrow`` element type is already part of the standard
girder_large_image_annotation schema.  These tests verify that the
built-in schema accepts valid arrow elements, rejects invalid ones,
and that the GirderPlugin loads without error.
"""
import jsonschema
import pytest


def test_valid_arrow_element_passes_validation():
    """A well-formed arrow element passes the standard validator."""
    from girder_large_image_annotation.models.annotation import Annotation

    element = {
        'type': 'arrow',
        'points': [[100, 200, 0], [300, 400, 0]],
    }
    # Should not raise
    Annotation.validatorAnnotationElement.validate(element)


def test_arrow_element_with_optional_fields_passes_validation():
    """An arrow element with all optional fields passes validation."""
    from girder_large_image_annotation.models.annotation import Annotation

    element = {
        'type': 'arrow',
        'points': [[100, 200, 0], [300, 400, 0]],
        'lineColor': 'rgb(0, 0, 0)',
        'lineWidth': 2,
        'fillColor': 'rgba(0, 0, 0, 0.5)',
    }
    Annotation.validatorAnnotationElement.validate(element)


def test_arrow_missing_points_fails_validation():
    """An arrow element without points fails validation."""
    from girder_large_image_annotation.models.annotation import Annotation

    element = {
        'type': 'arrow',
    }
    with pytest.raises(jsonschema.ValidationError):
        Annotation.validatorAnnotationElement.validate(element)


def test_arrow_with_one_point_fails_validation():
    """An arrow element with only one point fails validation."""
    from girder_large_image_annotation.models.annotation import Annotation

    element = {
        'type': 'arrow',
        'points': [[100, 200, 0]],
    }
    with pytest.raises(jsonschema.ValidationError):
        Annotation.validatorAnnotationElement.validate(element)


def test_arrow_with_three_points_fails_validation():
    """An arrow element with more than two points fails validation."""
    from girder_large_image_annotation.models.annotation import Annotation

    element = {
        'type': 'arrow',
        'points': [[100, 200, 0], [300, 400, 0], [500, 600, 0]],
    }
    with pytest.raises(jsonschema.ValidationError):
        Annotation.validatorAnnotationElement.validate(element)


def test_rectangle_element_still_passes_validation():
    """Arrow support does not break existing rectangle validation."""
    from girder_large_image_annotation.models.annotation import Annotation

    element = {
        'type': 'rectangle',
        'center': [100, 200, 0],
        'width': 50,
        'height': 30,
    }
    Annotation.validatorAnnotationElement.validate(element)


def test_girder_plugin_load_method_exists():
    """The GirderPlugin class exposes a load() method."""
    from histomicsui_arrow import GirderPlugin

    assert callable(getattr(GirderPlugin, 'load', None))
