const path = require("path");
const { fabric } = require("fabric");

const toBuffer = async (stream) => {
  const buffers = [];
  for await (const chunk of stream) {
    buffers.push(chunk);
  }
  return Buffer.concat(buffers);
};

const getFilename = (filename) => filename.replace(/\.png/, "--deepfried.png");

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

module.exports = async function ({ mention_id, filename }, { s3Client }) {
  const canvas = new fabric.StaticCanvas(null, { width: 200, height: 200 });

  fabric.nodeCanvas.registerFont(
    path.join(__dirname, "/font/Ubuntu/Ubuntu-Regular.ttf"),
    {
      family: "Ubuntu",
      weight: "regular",
      style: "normal",
    }
  );

  const text = new fabric.Text("Hello world", {
    left: 0,
    top: 100,
    fill: "#f55",
    angle: 15,
    fontFamily: "Ubuntu",
    fontSize: 20,
  });
  const rect = new fabric.Rect({ width: 200, height: 200, fill: "white" });

  canvas.add(rect);
  canvas.add(text);
  canvas.renderAll();

  const image = await toBuffer(canvas.createPNGStream());

  const deepFriedFilename = getFilename(filename);
  await uploadImage(s3Client, image, deepFriedFilename);

  return {
    mention_id,
    filename: deepFriedFilename,
  };
};
