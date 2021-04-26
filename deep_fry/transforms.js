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
  canvas.add(image);
  return canvas;
};

exports.canvasToBuffer = async (canvas) => {
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
