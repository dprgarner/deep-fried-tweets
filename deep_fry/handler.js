const S3 = require("aws-sdk/clients/s3");
const Lambda = require("aws-sdk/clients/lambda");

const { downloadImage, uploadImage, reply } = require("./aws");
const deepFry = require("./deep_fry");
const { bufferToCanvas, canvasToBuffer } = require("./transforms");
const {
  rainbowSparkle,
  madSharpen,
  noisy,
  washedOut,
  pick,
} = require("./random");
const { getBulges, getImages, getImageRegions } = require("./random_canvas");

const s3Client = new S3({ region: process.env.AWS_REGION });
const lambdaClient = new Lambda();

function createParams(event, canvas) {
  const params = pick([rainbowSparkle, madSharpen, noisy, washedOut])();

  const bulges = getBulges(canvas);
  const imageRegions = getImageRegions(canvas);
  const images = getImages(imageRegions, params);

  return {
    ...params,
    saucy: !!(
      event.mention.possibly_sensitive || event.target.possibly_sensitive
    ),
    bulges,
    images,
  };
}

exports.handler = async (event) => {
  const inputBuffer = await downloadImage(s3Client, event.filename);
  let { canvas, image } = await bufferToCanvas(inputBuffer, 0.5);

  const params = createParams(event, canvas);

  canvas = await deepFry(
    {
      canvas,
      image,
    },
    params
  );

  const outputBuffer = await canvasToBuffer(canvas, 1.5);

  const deepFriedFilename = event.filename.replace(/\.png/, "--deepfried.png");
  await uploadImage(s3Client, outputBuffer, deepFriedFilename);

  await reply(lambdaClient, {
    ...event,
    deep_fried_filename: deepFriedFilename,
  });
};
