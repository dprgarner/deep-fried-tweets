/**
 * For testing locally.
 * `cat ../events/deep_fry.json | node test.js`
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { promisify } = require("util");

const { downloadImage, uploadImage, reply } = require("./aws");
const deepFry = require("./deep_fry");
const {
  rainbowSparkle,
  madSharpen,
  noisy,
  washedOut,
  pick,
} = require("./random");
const { getImageRegions, getImages, getBulges } = require("./random_canvas");
const {
  bufferToCanvas,
  canvasToBuffer,
  cloneImage,
  cloneCanvas,
} = require("./transforms");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const fakeS3Client = {
  getObject: ({ Key }) => ({
    promise: async () => {
      const Body = await readFile(
        path.join(__dirname, "..", "img", "tweets", Key)
      );
      return { Body };
    },
  }),

  putObject: ({ Body, Key }) => ({
    promise: async () => {
      await writeFile(path.join(__dirname, "..", "img", "fried", Key), Body);
    },
  }),
};

const fakeLambdaClient = {
  invoke: (event) => ({
    promise: async () => {
      console.log(event);
    },
  }),
};

async function getInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });
  const lines = [];
  for await (const line of rl) {
    lines.push(line);
  }
  return lines.join("\n");
}

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

async function test() {
  const input = JSON.parse(await getInput());
  const events = input.length ? input : [input];

  for (const event of events) {
    console.log("Processing...");

    const inputBuffer = await downloadImage(fakeS3Client, event.filename);
    let { canvas, image } = await bufferToCanvas(inputBuffer, 0.5);

    const originalCanvas = await cloneCanvas(canvas);
    const originalImage = await cloneImage(image);

    for (let i = 0; i < 1; i++) {
      const params = createParams(event, canvas);

      canvas = await deepFry(
        {
          canvas: await cloneCanvas(originalCanvas),
          image: await cloneImage(originalImage),
        },
        params
      );

      const outputBuffer = await canvasToBuffer(canvas, 1.5);
      const deepFriedFilename = `${event.filename.slice(-20, -4)}--${i}.png`;

      await uploadImage(fakeS3Client, outputBuffer, deepFriedFilename);

      await reply(fakeLambdaClient, {
        ...event,
        deep_fried_filename: deepFriedFilename,
      });
    }
  }
}

test();
