const { fabric } = require("fabric");

exports.parabolaish = () =>
  0.25 + (Math.random() + Math.random() + Math.random()) / 6;

exports.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

exports.pickN = (arr, n) => {
  if (arr.length < n) return arr;
  if (n === 0) return [];
  let some = [...arr];
  const idx = Math.floor(Math.random() * arr.length);
  some.splice(idx, 1);
  return [arr[idx]].concat(exports.pickN(some, n - 1));
};

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

const isIn = (regions, { x, y }) => {
  for (const region of regions) {
    if (
      x > region.x &&
      x < region.x + region.width &&
      y > region.y &&
      y < region.y + region.height
    ) {
      return true;
    }
  }
  return false;
};

const distance = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

const getTargetProfile = (profileImages) => {
  const largeProfileImages = profileImages.filter((image) => image.width > 30);
  return largeProfileImages[largeProfileImages.length - 1];
};

exports.getBulges = (event, canvas) => {
  const w = Math.floor(canvas.width);
  const h = Math.floor(canvas.height);

  // Bulges should be placed on media or Tweet text
  const bulgeAreas = event.bounds.media.concat(event.bounds.text);

  const profileBoundPoints = [];
  // Avoid bulging near profile images that might get sunglasses or laser eyes
  const profileImage = getTargetProfile(event.bounds.profile_images);
  if (profileImage) {
    const profileImageMargin = 10;
    profileBoundPoints.push({
      x: profileImage.x - profileImageMargin,
      y: profileImage.y - profileImageMargin,
    });
    profileBoundPoints.push({
      x: profileImage.x + profileImage.width / 2,
      y: profileImage.y - profileImageMargin,
    });
    profileBoundPoints.push({
      x: profileImage.x + profileImage.width + profileImageMargin,
      y: profileImage.y - profileImageMargin,
    });
    profileBoundPoints.push({
      x: profileImage.x + profileImage.width + profileImageMargin,
      y: profileImage.y + profileImage.height / 2,
    });
    profileBoundPoints.push({
      x: profileImage.x + profileImage.width + profileImageMargin,
      y: profileImage.y + profileImage.height + profileImageMargin,
    });
    profileBoundPoints.push({
      x: profileImage.x + profileImage.width / 2,
      y: profileImage.y + profileImage.height + profileImageMargin,
    });
    profileBoundPoints.push({
      x: profileImage.x - profileImageMargin,
      y: profileImage.y + profileImage.height + profileImageMargin,
    });
    profileBoundPoints.push({
      x: profileImage.x - profileImageMargin,
      y: profileImage.y + profileImage.height / 2,
    });
  }

  let bulgeCandidates = [];

  const bulgeRadius = 100;
  // Bulges shouldn't appear too close to the edge
  const marginX = bulgeRadius;
  const marginY = bulgeRadius;

  const collidesWithProfile = (p1) => {
    for (const p2 of profileBoundPoints) {
      if (distance(p1, p2) < bulgeRadius) {
        return true;
      }
    }
    return false;
  };

  const collidesWithBulge = (p1) => {
    for (const p2 of bulgeCandidates) {
      if (distance(p1, p2) < 2 * bulgeRadius) {
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * (w - 2 * marginX) + marginX;
    const y = Math.random() * (h - 2 * marginY) + marginY;

    if (!isIn(bulgeAreas, { x, y })) continue;
    if (collidesWithProfile({ x, y })) continue;
    if (collidesWithBulge({ x, y })) continue;

    bulgeCandidates.push({
      x,
      y,
      strength: Math.min(1, 0.25 + exports.parabolaish()),
      radius: 100,
    });

    if (bulgeCandidates.length > 5) break;
  }

  return bulgeCandidates;
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
  return exports.pickN(imageRegions, Math.floor(2 + Math.random() * 2));
};

const smallImageWeights = {
  ok: 50,
  cryingeyesopen: 40,
  b: 30,
  100: 30,
  fire: 20,
  crying: 20,
  datboi: 10,
  // scream: 10,
  // flushedface: 10,
  // devil: 10,
};

const getTotalWeight = (weights) =>
  Object.values(weights).reduce((acc, x) => acc + x, 0);

const saucyImageWeights = {
  ...smallImageWeights,
  aubergine: 100,
  peach: 100,
  fire: 50,
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
