const chromium = require("chrome-aws-lambda");

const S3 = require("aws-sdk/clients/s3");
const Lambda = require("aws-sdk/clients/lambda");

const screenshotTweet = require("./screenshot_tweet");

const s3Client = new S3({ region: process.env.AWS_REGION });
var lambdaClient = new Lambda();

exports.handler = async (event) => {
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });

  await screenshotTweet(event, {
    browser,
    s3Client,
    lambdaClient,
  });
};
