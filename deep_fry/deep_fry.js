const { fabric } = require("fabric");

const {
  bufferToDataUri,
  dataUriToImage,
  imageToCanvas,
  jpegify,
  canvasToBuffer,
} = require("./transforms");

module.exports = async function (inputBuffer) {
  const dataUri = bufferToDataUri(inputBuffer);
  let image = await dataUriToImage(dataUri);
  let canvas = imageToCanvas(image);

  const scaleFactor = 2;
  image.scale(1 / scaleFactor);
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

  for (let i = 0; i < 20; i++) {
    await jpegify(canvas);
  }
  image = canvas.item(0);

  image.scale(scaleFactor);

  image.applyFilters();

  return canvasToBuffer(canvas);
};
