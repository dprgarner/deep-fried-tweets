const S3 = require("aws-sdk/clients/s3");
const Lambda = require("aws-sdk/clients/lambda");

const { downloadImage, uploadImage, reply } = require("./aws");
const deepFry = require("./deep_fry");

const s3Client = new S3({ region: process.env.AWS_REGION });
const lambdaClient = new Lambda();

exports.handler = async (event) => {
  const inputBuffer = await downloadImage(s3Client, event.filename);
  const outputBuffer = await deepFry(inputBuffer);

  const deepFriedFilename = event.filename.replace(/\.png/, "--deepfried.png");
  await uploadImage(s3Client, outputBuffer, deepFriedFilename);

  await reply(lambdaClient, {
    ...event,
    deep_fried_filename: deepFriedFilename,
  });
};
