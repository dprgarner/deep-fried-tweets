const fs = require("fs");
const path = require("path");
const { fabric } = require("fabric");
const { promisify } = require("util");
const { Image: CanvasImage } = require("canvas");

const readFile = promisify(fs.readFile);

exports.bufferToImage = async (buffer) => {
  const imageElement = await new Promise((res, rej) => {
    const img = new CanvasImage();
    img.onload = () => res(img);
    img.onerror = (err) => rej(err);
    img.src = buffer;
  });
  const image = new fabric.Image(imageElement);

  return image;
};

exports.pathToImage = async (filepath) => {
  const buffer = await readFile(path.join(__dirname, filepath));
  const image = await exports.bufferToImage(buffer);
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
  const image = await exports.bufferToImage(inputBuffer);
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

  const image = await new Promise((res) => {
    fabric.Image.fromURL(dataUri, (img) => {
      res(img);
    });
  });

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

exports.loadProfileImage = async ({
  x,
  y,
  width,
  height,
  zoomFactor,
  filepath,
}) => {
  const img = await exports.pathToImage(filepath);
  const shiftUp = 0.1;
  img.scale((zoomFactor * width) / img.width).set({
    top: y - ((zoomFactor - 1) * height) / 2 - shiftUp * height,
    left: x - ((zoomFactor - 1) * width) / 2,
    opacity: 1,
  });
  return img;
};
