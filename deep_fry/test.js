/**
 * For testing locally.
 * `cat ../events/deep_fry.json | node test.js`
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { promisify } = require("util");

const { downloadImage, uploadImage, reply } = require("./aws");
const createParams = require("./create_params");
const deepFry = require("./deep_fry");
const { bufferToCanvas, canvasToBuffer, clone } = require("./transforms");

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

async function test() {
  const input = JSON.parse(await getInput());
  const events = input.length ? input : [input];

  for (const event of events) {
    console.log("Processing...");

    const inputBuffer = await downloadImage(fakeS3Client, event.filename);
    let { canvas, image } = await bufferToCanvas(inputBuffer, 0.5);

    const { canvas: originalCanvas, image: originalImage } = await clone({
      canvas,
      image,
    });

    for (let i = 0; i < 3; i++) {
      canvas = originalCanvas;
      image = originalImage;

      const params = createParams(event, canvas);
      console.log(JSON.stringify(params, null, 2));

      canvas = await deepFry(
        await clone({ canvas: originalCanvas, image: originalImage }),
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
