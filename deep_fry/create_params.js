const {
  pick,
  parabolaish,
  getImageRegions,
  getImages,
  getBulges,
} = require("./random");

// Better on lighter images.
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

// Okay on lighter images, but not amazing: bit too reddish.
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

// Feels more glitchy than deep-fried
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

// Works well on images. But often feels like Mexico-bot.
const noisy = () => ({
  type: "noisy",
  brightness: 0.15,
  noise: 75 + parabolaish() * 50,
  redBlend: 0.15 + parabolaish() * 0.5,
  yellowBlend: 0.1,
  redGamma: 0.2 + Math.pow(Math.random(), 2),
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

// Absolutely destroys images.
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

const chooseBaseParams = (mode, hasMedia) => {
  if (mode === "dark" && hasMedia) {
    return pick([madSharpen, noisy, noisy])();
  } else if (mode === "dark" && !hasMedia) {
    return pick([rainbowSparkle, superSaturated, madSharpen, noisy])();
  } else if (mode == "light" && hasMedia) {
    return pick([rainbowSparkle, superSaturated, madSharpen, noisy, noisy])();
  } else if (mode == "light" && !hasMedia) {
    return pick([
      noisy,
      rainbowSparkle,
      rainbowSparkle,
      superSaturated,
      superSaturated,
      madSharpen,
      madSharpen,
      washedOut,
      washedOut,
    ])();
  }
};

const chooseProfileImage = (targetProfile) => {
  const profileImages = [];
  if (!targetProfile) return [];

  if (Math.random() < 0.5) {
    profileImages.push({
      ...targetProfile,
      zoomFactor: 2,
      filepath: "./img/lasereyes.png",
    });
  } else {
    profileImages.push({
      ...targetProfile,
      zoomFactor: 1.3,
      filepath: "./img/dealwithit.png",
    });
  }

  if (Math.random() < 0.25) {
    profileImages.push({
      ...targetProfile,
      zoomFactor: 1.75,
      filepath: "./img/joint.png",
    });
  }

  return profileImages;
};

const getTargetProfile = (profileImages) => {
  const largeProfileImages = profileImages.filter((image) => image.width > 30);
  return largeProfileImages[largeProfileImages.length - 1];
};

function createParams(event, canvas, mode) {
  const params = chooseBaseParams(mode, !!event.bounds.media);

  let bulges = params.shouldBulge ? getBulges(event, canvas) : [];
  let targetProfile = getTargetProfile(event.bounds.profile_images || []);

  const profileImages = chooseProfileImage(targetProfile);

  const imageRegions = getImageRegions(canvas);
  const images = getImages(imageRegions, params);

  return {
    ...params,
    mode,
    saucy: !!(
      event.mention.possibly_sensitive || event.target.possibly_sensitive
    ),
    bulges,
    images,
    profileImages,
  };
}

module.exports = createParams;
