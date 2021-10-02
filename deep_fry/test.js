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

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const selectMode = require("./select_mode");
const argv = yargs(hideBin(process.argv)).argv;

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

let replyEvents = [];
const fakeLambdaClient = {
  invoke: (event) => ({
    promise: async () => {
      console.log(event);
      const payload = JSON.parse(event.Payload);
      if (!payload.error) {
        replyEvents.push(payload);
      }
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

    const [light, dark] = await Promise.all([
      downloadImage(fakeS3Client, event.file.light).then((inputBuffer) =>
        bufferToCanvas(inputBuffer, 0.5)
      ),
      downloadImage(fakeS3Client, event.file.dark).then((inputBuffer) =>
        bufferToCanvas(inputBuffer, 0.5)
      ),
    ]);
    let { canvas, image, mode } = selectMode(event, light, dark);

    const { canvas: originalCanvas, image: originalImage } = await clone({
      canvas,
      image,
    });
    const repeat = argv.r || argv.repeat || 1;

    for (let i = 0; i < repeat; i++) {
      canvas = originalCanvas;
      image = originalImage;

      const params = createParams(event, canvas, mode);
      console.log("Parameters:\n ", JSON.stringify(params, null, 2));

      canvas = await deepFry(
        await clone({ canvas: originalCanvas, image: originalImage }),
        params
      );

      const outputBuffer = await canvasToBuffer(canvas, 1.5);
      const deepFriedFilename = `${event.file[mode].slice(0, -4)}--${i}.png`;

      await uploadImage(fakeS3Client, outputBuffer, deepFriedFilename);

      await reply(fakeLambdaClient, {
        ...event,
        file: {
          ...event.file,
          fried: deepFriedFilename,
        },
      });
    }
  }

  await writeFile(
    path.join(__dirname, "..", "events", "reply_gen.json"),
    JSON.stringify(replyEvents, null, 2)
  );
}

test();
