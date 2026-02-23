from setuptools import find_packages, setup

with open('README.rst') as readme_file:
    readme = readme_file.read()

setup(
    name='histomicsui-textbox',
    version='0.2.0',
    description=(
        'HistomicsUI plugins to display textbox and arrow annotations '
        'on Digital Slide Archive'
    ),
    version='0.1.0',
    description='HistomicsUI plugin to display textbox annotations on Digital Slide Archive',
    long_description=readme,
    long_description_content_type='text/x-rst',
    author='',
    license='Apache-2.0',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'License :: OSI Approved :: Apache Software License',
        'Natural Language :: English',
        'Programming Language :: Python :: 3',
    ],
    keywords='girder-plugin, histomicsui, digital-slide-archive, annotations',
    packages=find_packages(exclude=['test', 'test.*']),
    include_package_data=True,
    install_requires=[
        'girder-large-image-annotation',
    ],
    entry_points={
        'girder.plugin': [
            'histomicsui_textbox = histomicsui_textbox:GirderPlugin',
            'histomicsui_arrow = histomicsui_arrow:GirderPlugin',
        ],
    },
    python_requires='>=3.8',
    zip_safe=False,
)
