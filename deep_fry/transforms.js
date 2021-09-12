const fs = require("fs");
const path = require("path");
const { fabric } = require("fabric");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);

exports.bufferToDataUri = (buffer) =>
  `data:image/png;base64,${buffer.toString("base64")}`;

exports.dataUriToImage = (dataUri) =>
  new Promise((res) => {
    fabric.Image.fromURL(dataUri, (img) => {
      res(img);
    });
  });

exports.pathToImage = async (filepath) => {
  const buffer = await readFile(path.join(__dirname, filepath));
  const image = await exports.dataUriToImage(exports.bufferToDataUri(buffer));
  return image;
};

exports.imageToCanvas = (image, scaleFactor) => {
  const canvas = new fabric.StaticCanvas(null);
  canvas.setWidth(Math.round(image.width * scaleFactor));
  canvas.setHeight(Math.round(image.height * scaleFactor));
  image.scale(scaleFactor);
  canvas.add(image);
  return canvas;
};

exports.bufferToCanvas = async (inputBuffer, scaleFactor) => {
  const dataUri = exports.bufferToDataUri(inputBuffer);
  let image = await exports.dataUriToImage(dataUri);
  let canvas = exports.imageToCanvas(image, scaleFactor);
  return { canvas, image };
};

exports.canvasToBuffer = async (canvas, scaleFactor) => {
  canvas.setZoom(scaleFactor);
  canvas.setDimensions({
    width: canvas.getWidth() * scaleFactor,
    height: canvas.getHeight() * scaleFactor,
  });
  canvas.renderAll();

  const buffers = [];
  for await (const chunk of canvas.createPNGStream()) {
    buffers.push(chunk);
  }
  return Buffer.concat(buffers);
};

exports.jpegify = async (canvas, quality) => {
  const dataUri = canvas.toDataURL({
    format: "jpeg",
    quality,
  });
  const image = await exports.dataUriToImage(dataUri);
  canvas.clear();
  canvas.add(image);

  return image;
};

const cloneImage = (image) =>
  new Promise((res) => {
    image.cloneAsImage((newImage) => {
      res(newImage);
    });
  });

exports.clone = async ({ image }) => {
  const newImage = await cloneImage(image);
  const newCanvas = exports.imageToCanvas(newImage, 1);
  return { canvas: newCanvas, image: newImage };
};

exports.loadDankImage = async (imageParams) => {
  const dankImage = await exports.pathToImage(imageParams.filepath);
  const ratio = Math.min(
    imageParams.dw / dankImage.width,
    imageParams.dh / dankImage.height
  );
  const topOffset =
    dankImage.width > dankImage.height
      ? (ratio * (dankImage.width - dankImage.height)) / 2
      : 0;
  const leftOffset =
    dankImage.height > dankImage.width
      ? (ratio * (dankImage.height - dankImage.width)) / 2
      : 0;
  dankImage.scale(ratio).set({
    top: imageParams.y + topOffset,
    left: imageParams.x + leftOffset,
    opacity: imageParams.opacity,
  });
  return dankImage;
};
