const parabolaish = () => 0.25 + (Math.random() + Math.random()) / 4;

// Determined by trial and error:
// const rainbowSparkle = {
//   // Best: 0.1
//   // OK: -0.15 to 0.25
//   brightness: 0.1,

//   // Best: 0
//   // OK: -0.25 to 0.5
//   contrast: 0.25,

//   // Best: 50
//   // OK: 15-100
//   noise: 15,

//   // Best: 0.3
//   // OK: 0.2-0.6
//   redBlend: 0.35,

//   // Best: 0.15
//   // OK: 0-1
//   redGamma: 0,

//   // Best: 0
//   // OK: 0-1
//   yellowGamma: 0,

//   // OK: 0-25
//   // Best: 5
//   saturation: 5,

//   preJpeg: {
//     // OK: 0-5
//     // Best: 3
//     iterations: 3,

//     // OK: 0.3-0.8
//     // Best: 0.3
//     quality: 0.3,
//   },

//   postJpeg: {
//     // OK: 1-3
//     // Best: 3
//     iterations: 1,

//     // OK: 0.3-0.5
//     // Best: 0.3
//     quality: 0.3,
//   },
// };

exports.rainbowSparkle = () => ({
  brightness: -0.1 + parabolaish() * 0.5,
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
});
