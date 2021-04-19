const { fabric } = require("fabric");

const uploadImage = (s3Client, imageBuffer, filename) => {
  console.log("Uploading image to S3:", filename);

  return s3Client
    .putObject({
      Body: imageBuffer,
      Bucket: process.env.BUCKET_NAME,
      Key: filename,
    })
    .promise();
};

const downloadImage = async (s3Client, filename) => {
  console.log("Downloading image from S3:", filename);

  const response = await s3Client
    .getObject({
      Bucket: process.env.BUCKET_NAME,
      Key: filename,
    })
    .promise();

  return response.Body;
};

// const getFilename = (filename) => filename.replace(/\.png/, "--deepfried.png");
const getFilename = (filename) =>
  filename.replace(/\.png/, `--${new Date().valueOf()}.png`);

const bufferToDataUri = (buffer) =>
  `data:image/png;base64,${buffer.toString("base64")}`;

const dataUriToImage = (dataUri) =>
  new Promise((res) => {
    fabric.Image.fromURL(dataUri, (img) => {
      res(img);
    });
  });

const createCanvasFromImage = (image) => {
  const canvas = new fabric.StaticCanvas(null);
  canvas.setWidth(Math.round(image.width));
  canvas.setHeight(Math.round(image.height));
  canvas.add(image);
  return canvas;
};

const streamToBuffer = async (stream) => {
  const buffers = [];
  for await (const chunk of stream) {
    buffers.push(chunk);
  }
  return Buffer.concat(buffers);
};

const jpegify = async (canvas) => {
  const dataUri = canvas.toDataURL({
    format: "jpeg",
    quality: 0.5,
  });
  const image = await dataUriToImage(dataUri);
  canvas.clear();
  canvas.add(image);
};

module.exports = async function (event, { s3Client }) {
  const inputBuffer = await downloadImage(s3Client, event.filename);
  const dataUri = bufferToDataUri(inputBuffer);

  const scaleFactor = 2;

  let image = await dataUriToImage(dataUri);
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

  image.applyFilters();

  let canvas = createCanvasFromImage(image);
  for (let i = 0; i < 20; i++) {
    await jpegify(canvas);
  }
  image = canvas.item(0);

  image.scale(scaleFactor);

  image.applyFilters();
  canvas.renderAll();
  const outputBuffer = await streamToBuffer(canvas.createPNGStream());
  const deepFriedFilename = getFilename(event.filename);
  await uploadImage(s3Client, outputBuffer, deepFriedFilename);

  console.log("uploaded");
  return {
    ...event,
    deep_fried_filename: deepFriedFilename,
  };
};
