const fs = require("fs");
const readline = require("readline");
const { promisify } = require("util");

const puppeteer = require("puppeteer");

const screenshotTweet = require("./screenshot_tweet");

const writeFile = promisify(fs.writeFile);

const s3Client = {
  putObject: ({ Body, Key }) => ({
    promise: async () => {
      await writeFile(Key, Body);
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

async function main() {
  const event = JSON.parse(await getInput());
  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
  });

  const result = await screenshotTweet(event, {
    browser,
    s3Client,
    lambdaClient,
  });

  console.log(result);
}

main();
