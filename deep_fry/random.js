const parabolaish = () =>
  0.25 + (Math.random() + Math.random() + Math.random()) / 6;
exports.parabolaish = parabolaish;

exports.rainbowSparkle = () => ({
  brightness: 0.1 + parabolaish() * 0.4,
  contrast: -0.25 * parabolaish() * 0.75,
  noise: 15 + parabolaish() * 85,
  redBlend: 0.2 + parabolaish() * 0.4,
  redGamma: 0 + Math.pow(Math.random(), 2),
  yellowGamma: 0 + Math.pow(Math.random(), 3),
  saturation: Math.pow(Math.random(), 2) * 25,
  preJpeg: {
    iterations: Math.floor(parabolaish() * 6),
    quality: 0.3 + Math.pow(Math.random(), 3) * 0.5,
  },
  postJpeg: {
    iterations: Math.floor(parabolaish() * 5),
    quality: 0.3 + Math.pow(Math.random(), 3) * 0.2,
  },
  addOriginal: 0.15,
});

exports.madSharpen = () => ({
  noise: 0,
  brightness: 0.1 + parabolaish() * 0.1,
  redBlend: 0.2 + parabolaish() * 0.1,
  saturation: 20 * parabolaish(),
  sharpens: 1,
  preJpeg: {
    iterations: 8,
    quality: 0.3,
  },
  postJpeg: {
    iterations: 8,
    quality: 0.3,
  },
  addOriginal: 0.1,
});

exports.noisy = () => ({
  brightness: 0.15,
  noise: 75 + parabolaish() * 50,
  redBlend: 0.15 + parabolaish() * 0.5,

  preJpeg: {
    iterations: 8,
    quality: 0.3,
  },
  postJpeg: {
    iterations: 8,
    quality: 0.3,
  },
  addOriginal: 0.1,
});

exports.washedOut = () => ({
  brightness: parabolaish() * 0.2,
  contrast: 1,
  noise: 75,
  redBlend: 0.05,
  saturation: 20,
  sharpens: 1 + Math.floor(parabolaish() * 4),

  preJpeg: {
    iterations: 1,
    quality: 0.5,
  },
  postJpeg: {
    iterations: 8,
    quality: 0.5,
  },
  addOriginal: 0.1,
});

exports.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

exports.pickN = (arr, n) => {
  if (arr.length < n) return arr;
  if (n === 0) return [];
  let some = [...arr];
  const idx = Math.floor(Math.random() * arr.length);
  some.splice(idx, 1);
  return [arr[idx]].concat(exports.pickN(some, n - 1));
};
