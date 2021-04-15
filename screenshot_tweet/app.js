const { S3 } = require("@aws-sdk/client-s3");
const chromium = require("chrome-aws-lambda");

const s3Client = new S3({ region: process.env.AWS_REGION });

exports.handler = async ({ mention_id, target_user, target_id }) => {
  console.log("initialising Chromium...");

  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();

  const url = `https://publish.twitter.com/?query=${encodeURIComponent(
    `https://twitter.com/${target_user}/status/${target_id}`
  )}&widget=Tweet`;

  await page.setViewport({
    width: 600,
    height: 600,
    isMobile: true,
    deviceScaleFactor: 2,
  });
  console.log("Navigating to URL: ", url);
  await page.goto(url, { waitUntil: "networkidle2" });

  console.log("performing sanity check...");
  // Sanity check
  const tweetIframe = await page.waitForSelector("iframe");
  const frame = await tweetIframe.contentFrame();
  await frame.waitForFunction(
    (target_id) => {
      const links = [...document.querySelectorAll("[role=link]")].map(
        (el) => el.getAttribute("href").split("?")[0]
      );
      for (const link of links) {
        if (link.includes(`/status/${target_id}`)) {
          return true;
        }
      }
      return false;
    },
    {},
    target_id
  );

  const screenshot = await tweetIframe.screenshot();
  const filename = `${new Date()
    .toISOString()
    .replace(/(\.|:)/g, "-")}--${mention_id}.png`;
  console.log(`Taken screenshot. Uploading to S3 as ${filename}...`);

  const [res] = await Promise.all([
    s3Client.putObject({
      Body: screenshot,
      Bucket: process.env.BUCKET_NAME,
      Key: filename,
    }),
    browser.close(),
  ]);

  console.log("Successfully uploaded:", res);
};
