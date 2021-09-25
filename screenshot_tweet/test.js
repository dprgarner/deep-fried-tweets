/**
 * A test file for trying out screenshotting a tweet locally without having to
 * build the Lambda each time.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { promisify } = require("util");

const puppeteer = require("puppeteer");

const screenshotTweet = require("./screenshot_tweet");

const writeFile = promisify(fs.writeFile);

const s3Client = {
  putObject: ({ Body, Key }) => ({
    promise: async () => {
      await writeFile(path.join(__dirname, "..", "img", "tweets", Key), Body);
    },
  }),
};

let deepFryEvents = [];

const lambdaClient = {
  invoke: (event) => ({
    promise: async () => {
      console.log(event);
      const payload = JSON.parse(event.Payload);
      if (!payload.error) {
        deepFryEvents.push(payload);
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

async function main() {
  const input = JSON.parse(await getInput());
  const events = input.length ? input : [input];

  for (const event of events) {
    const browser = await puppeteer.launch({
      ignoreHTTPSErrors: true,
    });

    await screenshotTweet(event, {
      browser,
      s3Client,
      lambdaClient,
    });
  }

  await writeFile(
    path.join(__dirname, "..", "events", "deep_fry_gen.json"),
    JSON.stringify(deepFryEvents, null, 2)
  );
}

main();
