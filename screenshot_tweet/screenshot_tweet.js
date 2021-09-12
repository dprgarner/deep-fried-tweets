const DRY_RUN = process.env.DRY_RUN === "true";

async function navigateToTweet(page, tweetUrl) {
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

  return await retry(async () => {
    const iframe = await page.waitForSelector("iframe", { visible: true });
    const frameContent = await iframe.contentFrame();
    const links = await frameContent.$$eval("[role=link]", (els) =>
      els.map((el) => el.getAttribute("href"))
    );
    for (const link of links) {
      if (link.includes(`/status/${target_id}`)) {
        console.log("sanity check passed.");
        return iframe;
      }
    }
    throw new Error("Could not find link with ID", target_id);
  }, 1500);
}

const getProfileImages = async (iframe) => {
  const frameContent = await iframe.contentFrame();
  const profileImages = await frameContent.$$eval(
    'img[src*="profile_images"]',
    (imgs) =>
      imgs.map((img) => ({
        x: img.x,
        y: img.y,
        width: img.width,
        height: img.height,
      }))
  );
  return profileImages;
};

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

const deepFry = (lambdaClient, lambdaEvent) =>
  lambdaClient
    .invoke({
      FunctionName: process.env.DEEP_FRY_FUNCTION,
      InvocationType: DRY_RUN ? "DryRun" : "Event",
      Payload: JSON.stringify(lambdaEvent),
    })
    .promise();

module.exports = async (event, { browser, s3Client, lambdaClient }) => {
  const page = await browser.newPage();
  let uploadAndDeepFryPromise;

  try {
    await navigateToTweet(page, event.target.url);

    const frame = await waitForIframe(page, event.target.id);
    const profileImages = await getProfileImages(frame);

    console.log("Taking screenshot...");
    const screenshot = await frame.screenshot();

    const filename = getFilename(event.mention.id);

    uploadAndDeepFryPromise = (async () => {
      await uploadScreenshot(s3Client, screenshot, filename);
      const lambdaEvent = { ...event, filename, profile_images: profileImages };
      await deepFry(lambdaClient, lambdaEvent);
    })();
  } finally {
    const browserClosePromise = browser.close();

    if (uploadAndDeepFryPromise) {
      await uploadAndDeepFryPromise;
    }
    await browserClosePromise;
    console.log("Browser closed.");
  }
};
