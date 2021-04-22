const { fabric } = require("fabric");

const {
  bufferToDataUri,
  dataUriToImage,
  imageToCanvas,
  jpegify,
  canvasToBuffer,
} = require("./transforms");

async function parameterised({ canvas, image }, params) {
  if (params.redGamma) {
    image.filters.push(
      new fabric.Image.filters.Gamma({
        gamma: [1.5, 0.01, 0.01],
      })
    );
  }
  image.applyFilters();

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
  if (params.sharpen) {
    image.filters.push(
      new fabric.Image.filters.Convolute({
        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
      })
    );
  }
  image.applyFilters();

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

  canvas = await parameterised({ canvas, image }, params);

  const postScaleFactor = 1.5;
  canvas.setZoom(postScaleFactor);
  canvas.setDimensions({
    width: canvas.getWidth() * postScaleFactor,
    height: canvas.getHeight() * postScaleFactor,
  });

  return canvasToBuffer(canvas);
};
