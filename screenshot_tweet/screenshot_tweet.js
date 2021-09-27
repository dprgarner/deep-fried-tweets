const DRY_RUN = process.env.DRY_RUN === "true";

async function navigateToTweet(page, tweetId) {
  const pageUrl = `data:text/html,<html><body><div id="tweet-container"></div><script src="https://platform.twitter.com/widgets.js" charset="utf-8"></script><script>twttr.widgets.createTweet("${tweetId}", document.getElementById("tweet-container"), { theme: "light", width: 550, dnt: true });</script></body></html>`;

  await page.setViewport({
    width: 600,
    height: 1200,
    isMobile: true,
    deviceScaleFactor: 2,
  });
  console.log("Loading tweet ID: ", tweetId);
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
    const iframe = await page.waitForSelector("iframe", {
      visible: true,
      timeout: 2000,
    });
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

const trimLinks = async (iframe) => {
  try {
    const frameContent = await iframe.contentFrame();
    const height = await frameContent.evaluate(
      // eslint-disable-next-line no-undef
      () => document.documentElement.clientHeight
    );
    await frameContent.$$eval('[aria-label="Share"]', (els) =>
      els.forEach((el) => el.remove())
    );
    await frameContent.$$eval('[role="link"]', (els) =>
      els
        .filter((el) =>
          (el.getAttribute("href") || "").includes(`/intent/tweet`)
        )
        .forEach((el) => el.parentElement.remove())
    );
    await frameContent.waitForFunction(
      // eslint-disable-next-line no-undef
      (height) => document.documentElement.clientHeight < height,
      { timeout: 5000 },
      height
    );
  } catch (e) {
    console.error("Could not trim links:", e);
  }
};

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

const getTweetTextBounds = async (iframe) => {
  const frameContent = await iframe.contentFrame();
  const textDivs = await frameContent.$$eval(
    "div[lang]:not(article article div[lang])",
    (divs) =>
      divs.map((div) => {
        const { x, y, width, height } = div.getBoundingClientRect();
        return { x, y, width, height };
      })
  );
  return textDivs;
};

const getTweetMediaBounds = async (iframe) => {
  const frameContent = await iframe.contentFrame();
  const textDivs = await frameContent.$$eval(
    'a[href*="/photo/"],img[src*="thumb/"],img[src*="/card_img"]',
    (mediaElements) =>
      mediaElements.map((media) => {
        const { x, y, width, height } = media.getBoundingClientRect();
        return { x, y, width, height };
      })
  );
  return textDivs;
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

const apologise = (lambdaClient, lambdaEvent) =>
  lambdaClient
    .invoke({
      FunctionName: process.env.APOLOGISE_FUNCTION,
      InvocationType: DRY_RUN ? "DryRun" : "Event",
      Payload: JSON.stringify(lambdaEvent),
    })
    .promise();

module.exports = async (event, { browser, s3Client, lambdaClient }) => {
  const page = await browser.newPage();
  let uploadAndDeepFryPromise;

  try {
    await navigateToTweet(page, event.target.id);

    const frame = await waitForIframe(page, event.target.id);
    await trimLinks(frame);

    const [profileImages, textBounds, mediaBounds] = await Promise.all([
      getProfileImages(frame),
      getTweetTextBounds(frame),
      getTweetMediaBounds(frame),
    ]);

    console.log("Taking screenshot...");
    const screenshot = await frame.screenshot();

    const filename = getFilename(event.mention.id);

    uploadAndDeepFryPromise = (async () => {
      await uploadScreenshot(s3Client, screenshot, filename);
      const lambdaEvent = {
        ...event,
        filename,
        bounds: {
          profile_images: profileImages,
          text: textBounds,
          media: mediaBounds,
        },
      };
      await deepFry(lambdaClient, lambdaEvent);
    })();
  } catch (e) {
    console.error(e);
    try {
      await apologise(lambdaClient, {
        ...event,
        error: e.toString(),
      });
    } catch (e) {
      console.error("Failed to apologise:", e);
    }
  } finally {
    const browserClosePromise = browser.close();

    if (uploadAndDeepFryPromise) {
      await uploadAndDeepFryPromise;
    }
    await browserClosePromise;
    console.log("Browser closed.");
  }
};
