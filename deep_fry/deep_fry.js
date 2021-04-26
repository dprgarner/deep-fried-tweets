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

initBulgeFilter();

async function parameterised({ canvas, image }, params) {
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

  const dankImage = await pathToImage("./img/b.png");

  dankImage.scale(0.5).set({
    left: image.width - dankImage.width * 0.5 - 100,
    top: 50,
    opacity: 0.85,
    // angle: 30,
  });
  canvas.add(dankImage);

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

const countPixels = ({ map, w, h }, { x, y, dh, dw }) => {
  const upper = 250;
  const lower = 64;

  let totalBlack = 0;
  let totalWhite = 0;
  for (let i = y; i < Math.min(y + dh, h); i++) {
    for (let j = x; j < Math.min(x + dw, w); j++) {
      if (
        map.data[4 * (i * w + j)] < lower &&
        map.data[4 * (i * w + j) + 1] < lower &&
        map.data[4 * (i * w + j) + 2] < lower
      ) {
        totalBlack += 1;
      }
      if (
        map.data[4 * (i * w + j)] > upper &&
        map.data[4 * (i * w + j) + 1] > upper &&
        map.data[4 * (i * w + j) + 2] > upper
      ) {
        totalWhite += 1;
      }
    }
  }
  totalWhite /= dw * dh;
  totalBlack /= dw * dh;

  return { totalWhite, totalBlack };
};

const getBlankRegions = (canvas) => {
  canvas.renderAll();
  const ctx = canvas.getContext("2d");
  const w = Math.floor(canvas.width);
  const h = Math.floor(canvas.height);
  const map = ctx.getImageData(0, 0, w, h);

  let minBlob;
  let minWhite = 0;
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(Math.random() * w);
    const y = Math.floor(Math.random() * h);
    let dh = Math.floor(Math.max(100, 0.25 * h) * (0.75 + Math.random() * 0.5));
    dh = Math.min(dh, h - y);
    let dw = Math.min(dh, w - x);
    dh = dw;

    // const dw = dh;
    // const x = 280;
    // const y = 60;
    // const dh = 100;
    // const dw = 100;
    const { totalBlack, totalWhite } = countPixels(
      { map, w, h },
      { x, y, dw, dh }
    );
    console.log(w, h, x, y, dw, dh, "has average:", { totalBlack, totalWhite });
    if (totalWhite > minWhite) {
      minBlob = { x, y, dw, dh };
      minWhite = totalWhite;
    }
    canvas.add(
      new fabric.Rect({
        left: x,
        top: y,
        fill: "red",
        width: dw,
        height: dh,
        opacity: 0.02,
      })
    );
  }

  canvas.add(
    new fabric.Rect({
      left: minBlob.x,
      top: minBlob.y,
      fill: "blue",
      width: minBlob.dw,
      height: minBlob.dh,
      opacity: 0.2,
    })
  );
};

module.exports = async function (inputBuffer, params) {
  const dataUri = bufferToDataUri(inputBuffer);
  let image = await dataUriToImage(dataUri);
  const preScaleFactor = 0.5;
  let canvas = imageToCanvas(image, preScaleFactor);
  image.scale(preScaleFactor);

  // console.log(getBlankRegions(canvas, preScaleFactor));
  canvas = await parameterised({ canvas, image }, params);

  const postScaleFactor = 1.5;
  canvas.setZoom(postScaleFactor);
  canvas.setDimensions({
    width: canvas.getWidth() * postScaleFactor,
    height: canvas.getHeight() * postScaleFactor,
  });

  return canvasToBuffer(canvas);
};
