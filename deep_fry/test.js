const fs = require("fs");
const readline = require("readline");
const { promisify } = require("util");

const deepFry = require("./deep_fry");

const writeFile = promisify(fs.writeFile);
const s3Client = {
  putObject: ({ Body, Key }) => ({
    promise: async () => {
      await writeFile(Key, Body);
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

  await deepFry(event, { s3Client });
}

main();
