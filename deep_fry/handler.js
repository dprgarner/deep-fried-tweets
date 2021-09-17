const S3 = require("aws-sdk/clients/s3");
const Lambda = require("aws-sdk/clients/lambda");

const { downloadImage, uploadImage, reply } = require("./aws");
const deepFry = require("./deep_fry");
const { bufferToCanvas, canvasToBuffer } = require("./transforms");
const createParams = require("./create_params");

const s3Client = new S3({ region: process.env.AWS_REGION });
const lambdaClient = new Lambda();

exports.handler = async (event) => {
  console.info("Invoked with event: " + JSON.stringify(event));

  const inputBuffer = await downloadImage(s3Client, event.filename);
  let { canvas, image } = await bufferToCanvas(inputBuffer, 0.5);

  const params = createParams(event, canvas);
  console.info("Parameters: ", JSON.stringify(params));

  canvas = await deepFry({ canvas, image }, params);

  const outputBuffer = await canvasToBuffer(canvas, 1.5);
  const deepFriedFilename = event.filename.replace(/\.png/, "--deepfried.png");

  await uploadImage(s3Client, outputBuffer, deepFriedFilename);

  await reply(lambdaClient, {
    ...event,
    deep_fried_filename: deepFriedFilename,
  });
};
