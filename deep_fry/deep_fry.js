const { fabric } = require("fabric");

const initBulgeFilter = require("./bulge");
const {
  bufferToDataUri,
  dataUriToImage,
  imageToCanvas,
  jpegify,
  canvasToBuffer,
  pathToImage,
} = require("./transforms");
const { getBulges, getImageRegions, getImages } = require("./scan_canvas");

initBulgeFilter();

async function applyParams({ canvas, image }, params) {
  if (params.redGamma) {
    const red = 0.5 + params.redGamma * 2.5;
    const green = 0.1 + params.redGamma * (params.yellowGamma || 0) * 1.25;
    const blue = 0.1;
    image.filters.push(
      new fabric.Image.filters.Gamma({
        gamma: [red, green, blue],
      })
    );
  }

  image.applyFilters();

  if (params.bulges && params.bulges.length) {
    for (const bulge of params.bulges) {
      image.filters.push(
        new fabric.Image.filters.Bulge({
          ...bulge,
          x: image.width * bulge.x,
          y: image.height * bulge.y,
        })
      );
    }
    image.applyFilters();
  }

  if (params.preJpeg) {
    for (let i = 0; i < params.preJpeg.iterations; i++) {
      image = await jpegify(canvas, params.preJpeg.quality);
    }
  }

  if (params.noise) {
    image.filters.push(
      new fabric.Image.filters.Noise({
        noise: params.noise,
      })
    );
  }
  if (params.saturation) {
    image.filters.push(
      new fabric.Image.filters.Saturation({
        saturation: params.saturation,
      })
    );
  }
  if (params.contrast) {
    image.filters.push(
      new fabric.Image.filters.Contrast({
        contrast: params.contrast,
      })
    );
  }
  if (params.redBlend) {
    image.filters.push(
      new fabric.Image.filters.BlendColor({
        color: "#8888ff",
        mode: "subtract",
        alpha: params.redBlend,
      })
    );
  }

  for (let i = 0; i < params.sharpens || 0; i++) {
    image.filters.push(
      new fabric.Image.filters.Convolute({
        matrix: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
      })
    );
  }
  image.applyFilters();

  for (const imageParams of params.images) {
    const dankImage = await pathToImage(imageParams.filepath);
    const ratio = Math.min(
      imageParams.dw / dankImage.width,
      imageParams.dh / dankImage.height
    );
    const topOffset =
      dankImage.width > dankImage.height
        ? (ratio * (dankImage.width - dankImage.height)) / 2
        : 0;
    const leftOffset =
      dankImage.height > dankImage.width
        ? (ratio * (dankImage.height - dankImage.width)) / 2
        : 0;

    dankImage.scale(ratio).set({
      top: imageParams.y + topOffset,
      left: imageParams.x + leftOffset,
      opacity: imageParams.opacity,
    });
    canvas.add(dankImage);
  }

  if (params.postJpeg) {
    for (let i = 0; i < params.postJpeg.iterations; i++) {
      image = await jpegify(canvas, params.postJpeg.quality);
    }
  }

  if (params.brightness) {
    image.filters.push(
      new fabric.Image.filters.Brightness({
        brightness: params.brightness,
      })
    );
    image.applyFilters();
  }
  return canvas;
}

module.exports = async function (inputBuffer, params) {
  const dataUri = bufferToDataUri(inputBuffer);
  let image = await dataUriToImage(dataUri);
  const preScaleFactor = 0.5;
  let canvas = imageToCanvas(image, preScaleFactor);
  image.scale(preScaleFactor);

  const bulges = getBulges(canvas);
  const imageRegions = getImageRegions(canvas);
  const images = getImages(imageRegions);

  canvas = await applyParams(
    { canvas, image },
    {
      ...params,
      bulges,
      images,
    }
  );

  const postScaleFactor = 1.5;
  canvas.setZoom(postScaleFactor);
  canvas.setDimensions({
    width: canvas.getWidth() * postScaleFactor,
    height: canvas.getHeight() * postScaleFactor,
  });

  return canvasToBuffer(canvas);
};
