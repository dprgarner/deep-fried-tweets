async function navigateToTweet(page, target_user, target_id) {
  const tweetUrl = `https://twitter.com/${target_user}/status/${target_id}`;
  const pageUrl = `https://publish.twitter.com/?query=${encodeURIComponent(
    tweetUrl
  )}&widget=Tweet`;

  await page.setViewport({
    width: 600,
    height: 1200,
    isMobile: true,
    deviceScaleFactor: 2,
  });
  console.log("Loading tweet: ", tweetUrl);
  console.log("Page URL: ", pageUrl);

  await page.goto(pageUrl, { waitUntil: "networkidle2" });
}

const pause = (ms) => new Promise((res) => setTimeout(res, ms));
const retry = async function (gen, timeout, interval = 250) {
  try {
    console.log("attempting retry...");
    return await gen();
  } catch (e) {
    if (timeout <= 0) throw e;

    await pause(interval);
    return retry(gen, timeout - interval, interval);
  }
};

async function waitForIframe(page, target_id) {
  console.log("performing sanity check...");

  const iframe = await retry(async () => {
    const iframe = await page.waitForSelector("iframe", { visible: true });
    const frameContent = await iframe.contentFrame();
    const links = await frameContent.$$eval("[role=link]", (els) =>
      els.map((el) => el.getAttribute("href"))
    );
    for (const link of links) {
      if (link.includes(`/status/${target_id}`)) {
        return iframe;
      }
    }
    throw new Error("Could not find link with ID", target_id);
  }, 1500);

  console.log("sanity check passed.");
  return iframe;
}

const getFilename = (mention_id) =>
  `${new Date().toISOString().replace(/(\.|:)/g, "-")}--${mention_id}.png`;

const uploadScreenshot = (s3Client, screenshot, filename) => {
  console.log("Uploading screenshot to S3:", filename);

  return s3Client
    .putObject({
      Body: screenshot,
      Bucket: process.env.BUCKET_NAME,
      Key: filename,
    })
    .promise();
};

module.exports = async (
  { mention_id, target_user, target_id },
  { browser, s3Client }
) => {
  const page = await browser.newPage();
  let uploadPromise;

  try {
    await navigateToTweet(page, target_user, target_id);

    // try {
    const frame = await waitForIframe(page, target_id);
    // } catch (e) {
    //   const screenshot = await (
    //     await page.waitForSelector("iframe")
    //   ).screenshot({ fullPage: true });
    //   await uploadScreenshot(s3Client, screenshot, "./err.png");
    //   throw e;
    // }

    console.log("Taking screenshot...");
    const screenshot = await frame.screenshot();

    const filename = getFilename(mention_id);
    uploadPromise = uploadScreenshot(s3Client, screenshot, filename);

    return {
      mention_id,
      filename,
    };
  } finally {
    const browserClosePromise = browser.close();
    if (uploadPromise) {
      await uploadPromise;
    }
    await browserClosePromise;
    console.log("Browser closed.");
  }
};
