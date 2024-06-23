# Whiteboard Interface

Add a field to your collection for drawing sketches and ideas, using [Fabric.js](http://fabricjs.com).

![Screenshot of the Whiteboard Interface in action](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/whiteboard-interface/docs/preview.png)

The interface supports free drawing, rectangle and circle shapes, lines and arrows, wrapping text and inserting images from your file library.

## Installation

Refer to the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html) for details on installing the extension from the Marketplace or manually.

### Building from source

At this time, Fabric.js needs to be rebuilt after installing with their own build system to enable eraser support. We have added this step as a postinstall-script, but you need to install [uglify-js](https://www.npmjs.com/package/uglify-js) as a command line app first.

Apart from that, refer to the [Developing Extensions](https://docs.directus.io/extensions/creating-extensions.html#building-your-extension) documentation for instructions to build locally.

## Usage

Simply select Whiteboard as your interface when creating a new field in a collection. No additional options at this time.