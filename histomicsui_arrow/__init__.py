from girder import plugin


class GirderPlugin(plugin.GirderPlugin):
    DISPLAY_NAME = 'HistomicsUI Arrow Annotation'
    CLIENT_SOURCE_PATH = 'web_client'

    def load(self, info):
        # The ``arrow`` element type is already part of the standard
        # girder_large_image_annotation schema, so no backend schema
        # patching is required.  This plugin only provides the frontend
        # override that converts arrow elements to polylines for
        # rendering in HistomicsUI.
        pass
