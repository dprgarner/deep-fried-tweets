const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { promisify } = require("util");

const { downloadImage, uploadImage, reply } = require("./aws");
const deepFry = require("./deep_fry");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const s3Client = {
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

const lambdaClient = {
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

    const inputBuffer = await downloadImage(s3Client, event.filename);

    const lightlyBattered = {
      brightness: 0.15,
      contrast: 1,
      noise: 75,
      redBlend: 0.05,
      saturation: 20,
      sharpen: true,

      postJpeg: {
        iterations: 8,
        quality: 0.5,
      },
    };

    const prettyNoisy = {
      brightness: 0.15,
      noise: 100,
      redBlend: 0.25,
      redGamma: true,
      preJpeg: {
        iterations: 8,
        quality: 0.3,
      },
      postJpeg: {
        iterations: 8,
        quality: 0.3,
      },
    };

    const rainbowSparkle = {
      brightness: 0.35,
      contrast: 0.25,
      noise: 5,
      redBlend: 0.35,
      redGamma: true,
      saturation: 25,
      preJpeg: {
        iterations: 8,
        quality: 0.3,
      },
    };
    const outputBuffer = await deepFry(
      inputBuffer,
      [lightlyBattered, prettyNoisy, rainbowSparkle][
        Math.floor(Math.random() * 3)
      ]
    );

    const deepFriedFilename = event.filename.replace(
      /\.png/,
      `--${new Date().valueOf()}.png`
    );

    await uploadImage(s3Client, outputBuffer, deepFriedFilename);

    await reply(lambdaClient, {
      ...event,
      deep_fried_filename: deepFriedFilename,
    });
  }
}

test();
