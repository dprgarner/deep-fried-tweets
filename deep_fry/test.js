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
    const outputBuffer = await deepFry(inputBuffer);

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
