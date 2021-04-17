module.exports = async (
  { mention_id, target_user, target_id },
  { browser, logger, s3Client }
) => {
  const page = await browser.newPage();

  const tweetUrl = `https://twitter.com/${target_user}/status/${target_id}`;
  const pageUrl = `https://publish.twitter.com/?query=${encodeURIComponent(
    tweetUrl
  )}&widget=Tweet`;

  await page.setViewport({
    width: 600,
    height: 600,
    isMobile: true,
    deviceScaleFactor: 2,
  });
  logger("Navigating to URL: ", pageUrl);
  await page.goto(pageUrl, { waitUntil: "networkidle2" });

  logger("performing sanity check...");
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
  logger(`Taken screenshot. Uploading to S3 as ${filename}...`);

  const [res] = await Promise.all([
    s3Client
      .putObject({
        Body: screenshot,
        Bucket: process.env.BUCKET_NAME,
        Key: filename,
      })
      .promise(),
    browser.close(),
  ]);

  logger("Successfully uploaded:", res);

  return {
    mention_id,
    filename,
  };
};
