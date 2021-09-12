const { fabric } = require("fabric");

const initBulgeFilter = require("./bulge");
const {
  jpegify,
  clone,
  loadDankImage,
  loadProfileImage,
} = require("./transforms");

initBulgeFilter();

module.exports = async function applyParams({ canvas, image }, params) {
  const dankImages = [];
  for (const imageParams of params.images) {
    dankImages.push(await loadDankImage(imageParams));
  }

  const profileImages = [];
  for (const profileImageParams of params.profileImages) {
    profileImages.push(await loadProfileImage(profileImageParams));
  }

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

  const originalImage = (await clone({ canvas, image })).image;

  if (params.redGamma || params.yellowGamma) {
    const red =
      0.5 + (params.redGamma || 0) * 2.5 + (params.yellowGamma || 0) * 1.25;
    const green =
      0.1 + (params.redGamma || 0) * 1.25 + (params.yellowGamma || 0) * 1.25;
    const blue = 0.1;
    image.filters.push(
      new fabric.Image.filters.Gamma({
        gamma: [red, green, blue],
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
        alpha: params.redBlend / 3,
      })
    );
    for (const dankImage of dankImages) {
      const nerfFactor = 5;
      dankImage.filters.push(
        new fabric.Image.filters.BlendColor({
          color: "#8888ff",
          mode: "subtract",
          alpha: params.redBlend / nerfFactor,
        })
      );
    }
  }

  if (params.yellowBlend) {
    image.filters.push(
      new fabric.Image.filters.BlendColor({
        color: "#0000ff",
        mode: "subtract",
        alpha: params.yellowBlend / 3,
      })
    );
    for (const dankImage of dankImages) {
      const nerfFactor = 5;
      dankImage.filters.push(
        new fabric.Image.filters.BlendColor({
          color: "#0000ff",
          mode: "subtract",
          alpha: params.yellowBlend / nerfFactor,
        })
      );
    }
  }

  for (let i = 0; i < params.sharpens || 0; i++) {
    image.filters.push(
      new fabric.Image.filters.Convolute({
        matrix: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
      })
    );
  }
  image.applyFilters();

  if (params.addOriginal) {
    originalImage.set({ opacity: params.addOriginal });
    canvas.add(originalImage);
  }

  for (const dankImage of dankImages) {
    dankImage.applyFilters();
    canvas.add(dankImage);
  }

  for (const profileImage of profileImages) {
    canvas.add(profileImage);
  }

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
};
