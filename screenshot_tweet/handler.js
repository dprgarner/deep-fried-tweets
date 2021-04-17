const chromium = require("chrome-aws-lambda");

const S3 = require("aws-sdk/clients/s3");
const s3Client = new S3({ region: process.env.AWS_REGION });

const screenshotTweet = require("./screenshot_tweet");

exports.handler = async (event) => {
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });

  const result = await screenshotTweet(event, {
    browser,
    s3Client,
  });

  console.log(result);
};
