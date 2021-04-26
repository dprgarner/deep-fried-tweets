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
const { pickN, parabolaish } = require("./random");

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

const getBulgeRegions = (canvas) => {
  canvas.renderAll();
  const ctx = canvas.getContext("2d");
  const w = Math.floor(canvas.width);
  const h = Math.floor(canvas.height);

  const dw = 150;
  const dh = 100;
  const bulgeRegions = [];

  for (let i = 0; i < 6; i++) {
    const map = ctx.getImageData(0, 0, w, h);
    let maxBlackCoords;
    let maxBlackRatio = 0;

    for (let j = 0; j < 100; j++) {
      const x = Math.floor(dw + Math.random() * (w - 2 * dw));
      const y = Math.floor(dh + Math.random() * (h - 2 * dh));
      const { totalBlack } = countPixels({ map, w, h }, { x, y, dw, dh });
      if (totalBlack >= maxBlackRatio) {
        maxBlackCoords = { x, y, dw, dh };
        maxBlackRatio = totalBlack;
      }
    }

    bulgeRegions.push(
      new fabric.Rect({
        left: maxBlackCoords.x,
        top: maxBlackCoords.y,
        width: maxBlackCoords.dw,
        height: maxBlackCoords.dh,
        fill: "#aaa",
        opacity: 1,
      })
    );
    canvas.add(bulgeRegions[bulgeRegions.length - 1]);
    canvas.renderAll();
  }
  const bulges = [];
  for (const bulgeRegion of bulgeRegions) {
    canvas.remove(bulgeRegion);
    bulges.push({
      x: bulgeRegion.left / w,
      y: bulgeRegion.top / h,
      strength: Math.min(1, 0.5 + parabolaish()),
      radius: 100,
    });
  }

  canvas.renderAll();
  return pickN(bulges, Math.floor(1 + Math.random() * 2));
};

module.exports = async function (inputBuffer, params) {
  const dataUri = bufferToDataUri(inputBuffer);
  let image = await dataUriToImage(dataUri);
  const preScaleFactor = 0.5;
  let canvas = imageToCanvas(image, preScaleFactor);
  image.scale(preScaleFactor);

  const bulges = getBulgeRegions(canvas);
  canvas = await parameterised(
    { canvas, image },
    {
      ...params,
      bulges,
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
