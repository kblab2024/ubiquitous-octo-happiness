histomicsui-textbox
===================

A `Digital Slide Archive (DSA)`_ / `HistomicsUI`_ plugin that adds support for
displaying **textbox** annotation elements in the slide viewer.

A *textbox* annotation element renders a labelled rectangle on top of a whole-
slide image.  It shares the geometry of the existing ``rectangle`` element type
and extends it with a ``text`` field that specifies the content to display
inside the box.

.. _Digital Slide Archive: https://github.com/DigitalSlideArchive/digital_slide_archive
.. _HistomicsUI: https://github.com/DigitalSlideArchive/HistomicsUI


Requirements
------------

* Python ≥ 3.8
* ``girder-large-image-annotation`` (installed automatically as a dependency)


Installation
------------

.. code-block:: bash

    pip install histomicsui-textbox

After installation, enable the plugin in the Girder administration panel and
restart Girder.


Textbox annotation format
-------------------------

A *textbox* annotation element has the following JSON structure:

.. code-block:: json

    {
        "type": "textbox",
        "center": [512, 256, 0],
        "width": 200,
        "height": 80,
        "rotation": 0,
        "text": "Region of interest",
        "fillColor": "rgba(255, 255, 255, 0.5)",
        "lineColor": "rgb(0, 0, 0)",
        "lineWidth": 2
    }

Fields:

``type``
    Must be ``"textbox"``.

``center``
    ``[x, y]`` or ``[x, y, z]`` coordinate of the rectangle centre in slide
    pixel space (z defaults to 0).

``width``, ``height``
    Dimensions of the bounding rectangle in slide pixels (≥ 0).

``rotation`` *(optional)*
    Rotation in radians counter-clockwise around the normal axis.

``text``
    The text string to display inside the rectangle.

``fillColor`` *(optional)*
    Background colour of the rectangle (CSS colour string or ``rgba(…)``).

``lineColor`` *(optional)*
    Border colour of the rectangle.

``lineWidth`` *(optional)*
    Border width in pixels (≥ 0).

``label`` *(optional)*
    A ``label`` object ``{"value": "…"}`` overrides the displayed label text.
    If omitted the value of ``text`` is used instead.

``group``, ``user`` *(optional)*
    Standard annotation metadata fields.


How it works
------------

**Backend (Python)**
    The plugin registers a Girder plugin that extends the
    ``girder_large_image_annotation`` JSON schema to recognise the ``textbox``
    element type.  This allows textbox elements to pass validation and be stored
    in the database without modification alongside other annotation element
    types.

**Frontend (JavaScript)**
    The plugin's web client overrides
    ``AnnotationModel.prototype.geojson`` from
    ``@girder/large_image_annotation``.  When an annotation contains one or
    more ``textbox`` elements the override converts each element to a
    ``rectangle`` element, setting the ``label.value`` from the ``text``
    field before passing the element list to the standard GeoJSON conversion
    pipeline.  HistomicsUI then renders the rectangle and its label without
    any further changes.  Annotations that contain no textbox elements are
    handled by the original method.


Development
-----------

.. code-block:: bash

    git clone https://github.com/kblab2024/ubiquitous-octo-happiness.git
    cd ubiquitous-octo-happiness
    pip install -e .

To run the tests:

.. code-block:: bash

    pip install pytest girder-large-image-annotation
    pytest tests/


License
-------

Apache Software License 2.0 – see ``LICENSE`` for details.
