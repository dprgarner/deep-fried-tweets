const {
  pick,
  parabolaish,
  getImageRegions,
  getImages,
  getBulges,
} = require("./random");

const rainbowSparkle = () => ({
  type: "rainbowSparkle",
  brightness: 0.05 + parabolaish() * 0.2,
  contrast: -0.25 * parabolaish() * 0.75,
  noise: 15 + parabolaish() * 85,
  redBlend: 0.2 + parabolaish() * 0.4,
  redGamma: 0 + Math.pow(Math.random(), 2),
  yellowGamma: 0.1 + 0.3 * parabolaish(),
  saturation: 4,
  preJpeg: {
    iterations: 1 + Math.floor(parabolaish() * 5),
    quality: 0.3 + Math.pow(Math.random(), 3) * 0.5,
  },
  postJpeg: {
    iterations: 1 + Math.floor(parabolaish() * 4),
    quality: 0.3 + Math.pow(Math.random(), 3) * 0.2,
  },
  addOriginal: 0.15,
  shouldBulge: true,
});

const superSaturated = () => ({
  type: "superSaturated",
  brightness: 0.1 + parabolaish() * 0.4,
  contrast: -0.25 * parabolaish() * 0.75,
  redBlend: 0.1 + parabolaish() * 0.4,
  redGamma: 0.1 + 0.1 * Math.pow(Math.random(), 2),
  yellowGamma: 0.1 + 0.3 * parabolaish(),
  saturation: 10 + Math.pow(Math.random(), 2) * 5,
  preJpeg: {
    iterations: 1 + Math.floor(parabolaish() * 4),
    quality: 0.3 + Math.pow(Math.random(), 3) * 0.5,
  },
  postJpeg: {
    iterations: 1 + Math.floor(parabolaish() * 2),
    quality: 0.3 + Math.pow(Math.random(), 3) * 0.2,
  },
  addOriginal: 0.25,
  shouldBulge: true,
});

const madSharpen = () => ({
  type: "madSharpen",
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
  addOriginal: 0.25,
  shouldBulge: false,
});

const noisy = () => ({
  type: "noisy",
  brightness: 0.15,
  noise: 75 + parabolaish() * 50,
  redBlend: 0.15 + parabolaish() * 0.5,
  yellowBlend: 0.1,
  redGamma: 0 + Math.pow(Math.random(), 2),
  yellowGamma: 0 + Math.pow(Math.random(), 3),
  preJpeg: {
    iterations: 8,
    quality: 0.3,
  },
  postJpeg: {
    iterations: 8,
    quality: 0.3,
  },
  addOriginal: 0.1,
  shouldBulge: true,
});

const washedOut = () => ({
  type: "washedOut",
  brightness: parabolaish() * 0.2,
  contrast: 1,
  noise: 75,

  yellowBlend: 0.25 + 0.5 * parabolaish(),

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
  shouldBulge: true,
});

const shouldDisplayBulges = () => Math.random() > 0.5;
const shouldDisplayLaserEyes = () => Math.random() > 0.5;

const getTargetProfile = (profileImages) => {
  const largeProfileImages = profileImages.filter((image) => image.width > 30);
  return largeProfileImages[largeProfileImages.length - 1];
};

function createParams(event, canvas) {
  const params = pick([
    rainbowSparkle,
    superSaturated,
    madSharpen,
    noisy,
    washedOut,
  ])();

  let bulges = params.shouldBulge ? getBulges(canvas) : [];
  let targetProfile = getTargetProfile(event.profile_images || []);

  let profileImages = [];
  if (bulges.length && targetProfile && !shouldDisplayBulges()) {
    // Can't show both, it looks broken
    if (shouldDisplayLaserEyes()) {
      bulges = [];
      profileImages = [
        {
          ...targetProfile,
          zoomFactor: 2,
          filepath: "./img/lasereyes.png",
        },
      ];
    } else {
      bulges = [];
      profileImages = [
        {
          ...targetProfile,
          zoomFactor: 1.25,
          filepath: "./img/dealwithit.png",
        },
      ];
    }
  }

  const imageRegions = getImageRegions(canvas);
  const images = getImages(imageRegions, params);

  return {
    ...params,
    saucy: !!(
      event.mention.possibly_sensitive || event.target.possibly_sensitive
    ),
    bulges,
    images,
    profileImages,
  };
}

module.exports = createParams;
