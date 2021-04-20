const { fabric } = require("fabric");

exports.bufferToDataUri = (buffer) =>
  `data:image/png;base64,${buffer.toString("base64")}`;

exports.dataUriToImage = (dataUri) =>
  new Promise((res) => {
    fabric.Image.fromURL(dataUri, (img) => {
      res(img);
    });
  });

exports.imageToCanvas = (image) => {
  const canvas = new fabric.StaticCanvas(null);
  canvas.setWidth(Math.round(image.width));
  canvas.setHeight(Math.round(image.height));
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

exports.jpegify = async (canvas) => {
  const dataUri = canvas.toDataURL({
    format: "jpeg",
    quality: 0.5,
  });
  const image = await exports.dataUriToImage(dataUri);
  canvas.clear();
  canvas.add(image);
};
