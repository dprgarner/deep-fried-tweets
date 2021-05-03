const { fabric } = require("fabric");
const { pickN, parabolaish } = require("./random");

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

exports.getBulges = (canvas) => {
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

exports.getImageRegions = (canvas) => {
  canvas.renderAll();
  const ctx = canvas.getContext("2d");
  const w = Math.floor(canvas.width);
  const h = Math.floor(canvas.height);

  const blankRegions = [];

  for (let i = 0; i < 6; i++) {
    const map = ctx.getImageData(0, 0, w, h);
    let bestCoords;
    let bestScore = -Infinity;

    for (let j = 0; j < 100; j++) {
      const dh = Math.min(
        canvas.height / 4,
        Math.floor(100 + Math.random() * 50)
      );
      const dw = dh;
      const x = Math.floor(dw + Math.random() * (w - 2 * dw));
      const y = Math.floor(dh + Math.random() * (h - 2 * dh));
      const { totalBlack, totalWhite } = countPixels(
        { map, w, h },
        { x, y, dw, dh }
      );
      const score = totalWhite - 100 * totalBlack;
      if (score >= bestScore) {
        bestCoords = { x, y, dw, dh };
        bestScore = score;
      }
    }

    if (bestScore > 0.8) {
      blankRegions.push(
        new fabric.Rect({
          left: bestCoords.x,
          top: bestCoords.y,
          width: bestCoords.dw,
          height: bestCoords.dh,
          fill: "black",
          opacity: 1,
        })
      );
      canvas.add(blankRegions[blankRegions.length - 1]);
      canvas.renderAll();
    }
  }
  const imageRegions = [];
  for (const blankRegion of blankRegions) {
    canvas.remove(blankRegion);
    imageRegions.push({
      x: blankRegion.left,
      y: blankRegion.top,
      dw: blankRegion.width,
      dh: blankRegion.height,
    });
  }

  canvas.renderAll();
  return pickN(imageRegions, Math.floor(2 + Math.random() * 2));
};

const smallImageWeights = {
  ok: 5,
  crying: 5,
  cryingeyesopen: 4,
  scream: 3,
  b: 3,
  100: 3,
  flushedface: 2,
  fire: 2,
  devil: 2,
  datboi: 1,
};
const getTotalWeight = (weights) =>
  Object.values(weights).reduce((acc, x) => acc + x, 0);

const saucyImageWeights = {
  ...smallImageWeights,
  aubergine: 10,
  peach: 10,
  fire: 5,
};

const getRandomSmallImage = ({ saucy }) => {
  const weights = saucy ? saucyImageWeights : smallImageWeights;
  let random = Math.random() * getTotalWeight(weights);

  for (const [key, weight] of Object.entries(weights)) {
    if (weight >= random) {
      return key;
    }
    random -= weight;
  }
};

exports.getImages = (smallImageRegions, params) => {
  const smallestHeight = smallImageRegions.reduce(
    (acc, x) => Math.min(acc, x.dh),
    Infinity
  );
  const majorImage = getRandomSmallImage(params);
  const minorImage = getRandomSmallImage(params);

  return smallImageRegions.map((imageRegion, idx) => ({
    ...imageRegion,
    dw: smallestHeight,
    dh: smallestHeight,
    filepath: `./img/${idx === 0 ? minorImage : majorImage}.png`,
    opacity: 0.85,
  }));
};
