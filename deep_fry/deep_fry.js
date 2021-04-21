const { fabric } = require("fabric");

const {
  bufferToDataUri,
  dataUriToImage,
  imageToCanvas,
  jpegify,
  canvasToBuffer,
} = require("./transforms");

async function lightlyBattered({ canvas, image }) {
  image.filters.push(
    new fabric.Image.filters.Noise({
      noise: 75,
    })
  );
  image.filters.push(
    new fabric.Image.filters.Saturation({
      saturation: 20,
    })
  );
  image.filters.push(
    new fabric.Image.filters.Contrast({
      contrast: 1,
    })
  );
  image.filters.push(
    new fabric.Image.filters.Brightness({
      brightness: 0.15,
    })
  );
  image.filters.push(
    new fabric.Image.filters.BlendColor({
      color: "#0000ff",
      mode: "exclusion",
      alpha: 0.05,
    })
  );
  image.filters.push(
    new fabric.Image.filters.Convolute({
      matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
    })
  );

  image.applyFilters();

  for (let i = 0; i < 8; i++) {
    await jpegify(canvas, 0.5);
  }
  return canvas;
}

async function prettyMangled({ canvas, image }) {
  image.filters.push(
    new fabric.Image.filters.Gamma({
      gamma: [1.5, 0.01, 0.01],
    })
  );
  image.filters.push(
    new fabric.Image.filters.BlendColor({
      color: "#8888ff",
      mode: "subtract",
      alpha: 0.5,
    })
  );
  image.applyFilters();

  for (let i = 0; i < 8; i++) {
    await jpegify(canvas, 0.3);
  }
  image = canvas.item(0);
  image.filters.push(
    new fabric.Image.filters.Noise({
      noise: 50,
    })
  );
  image.filters.push(
    new fabric.Image.filters.Brightness({
      brightness: 0.25,
    })
  );

  image.applyFilters();

  for (let i = 0; i < 8; i++) {
    await jpegify(canvas, 0.3);
  }
  return canvas;
}

async function extraCrispy({ canvas, image }) {
  image.filters.push(
    new fabric.Image.filters.Gamma({
      gamma: [1.5, 0.01, 0.01],
    })
  );
  image.filters.push(
    new fabric.Image.filters.BlendColor({
      color: "#8888ff",
      mode: "subtract",
      alpha: 0.5,
    })
  );
  image.applyFilters();

  for (let i = 0; i < 8; i++) {
    await jpegify(canvas, 0.3);
  }
  image = canvas.item(0);
  image.filters.push(
    new fabric.Image.filters.Noise({
      noise: 5,
    })
  );
  image.filters.push(
    new fabric.Image.filters.Brightness({
      brightness: 0.35,
    })
  );
  image.filters.push(
    new fabric.Image.filters.Contrast({
      contrast: 0.25,
    })
  );
  image.filters.push(
    new fabric.Image.filters.Saturation({
      saturation: 150,
    })
  );
  image.filters.push(
    new fabric.Image.filters.Convolute({
      matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
    })
  );

  image.applyFilters();

  for (let i = 0; i < 8; i++) {
    await jpegify(canvas, 0.3);
  }
  return canvas;
}

module.exports = async function (inputBuffer) {
  const dataUri = bufferToDataUri(inputBuffer);
  let image = await dataUriToImage(dataUri);
  const preScaleFactor = 0.5;
  let canvas = imageToCanvas(image, preScaleFactor);
  image.scale(preScaleFactor);

  // canvas = await prettyMangled({ canvas, image });
  // canvas = await lightlyBattered({ canvas, image });
  canvas = await extraCrispy({ canvas, image });

  const postScaleFactor = 1.5;
  canvas.setZoom(postScaleFactor);
  canvas.setDimensions({
    width: canvas.getWidth() * postScaleFactor,
    height: canvas.getHeight() * postScaleFactor,
  });

  return canvasToBuffer(canvas);
};
