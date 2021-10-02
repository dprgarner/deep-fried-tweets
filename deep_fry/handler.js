const S3 = require("aws-sdk/clients/s3");
const Lambda = require("aws-sdk/clients/lambda");

const { downloadImage, uploadImage, reply, apologise } = require("./aws");
const deepFry = require("./deep_fry");
const { bufferToCanvas, canvasToBuffer } = require("./transforms");
const createParams = require("./create_params");
const selectMode = require("./select_mode");

const s3Client = new S3({ region: process.env.AWS_REGION });
const lambdaClient = new Lambda();

exports.handler = async (event) => {
  console.info("Invoked with event: " + JSON.stringify(event));

  try {
    const [light, dark] = await Promise.all([
      downloadImage(s3Client, event.file.light).then((inputBuffer) =>
        bufferToCanvas(inputBuffer, 0.5)
      ),
      downloadImage(s3Client, event.file.dark).then((inputBuffer) =>
        bufferToCanvas(inputBuffer, 0.5)
      ),
    ]);
    let { canvas, image, mode } = selectMode(event, light, dark);

    const params = createParams(event, canvas, mode);
    console.info("Parameters: ", JSON.stringify(params));

    canvas = await deepFry({ canvas, image }, params);

    const outputBuffer = await canvasToBuffer(canvas, 1.5);
    const deepFriedFilename = event.file[mode].replace(
      /\.png/,
      "--deepfried.png"
    );

    await uploadImage(s3Client, outputBuffer, deepFriedFilename);

    await reply(lambdaClient, {
      ...event,
      file: {
        ...event.file,
        fried: deepFriedFilename,
      },
    });
  } catch (e) {
    console.error(e);
    await apologise(lambdaClient, {
      ...event,
      error: e.toString(),
    });
  }
};
