const { promisify } = require("util");
const fs = require("fs");
const readline = require("readline");

const puppeteer = require("puppeteer");

const writeFile = promisify(fs.writeFile);

const screenshotTweet = require("./screenshot_tweet");

const s3Client = {
  putObject: async ({ Body, Key }) => {
    await writeFile(Key, Body);
  },
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
    logger: console.log.bind(console),
  });

  console.log(result);
}

main();
