exports.downloadImage = async (s3Client, filename) => {
  console.info("Downloading image from S3:", filename);

  const response = await s3Client
    .getObject({
      Bucket: process.env.BUCKET_NAME,
      Key: filename,
    })
    .promise();

  return response.Body;
};

exports.uploadImage = (s3Client, imageBuffer, filename) => {
  console.info("Uploading image to S3:", filename);

  return s3Client
    .putObject({
      Body: imageBuffer,
      Bucket: process.env.BUCKET_NAME,
      Key: filename,
    })
    .promise();
};

const DRY_RUN = process.env.DRY_RUN === "true";

exports.reply = (lambdaClient, lambdaEvent) =>
  lambdaClient
    .invoke({
      FunctionName: process.env.REPLY_FUNCTION,
      InvocationType: DRY_RUN ? "DryRun" : "Event",
      Payload: JSON.stringify(lambdaEvent),
    })
    .promise();

exports.apologise = (lambdaClient, lambdaEvent) =>
  lambdaClient
    .invoke({
      FunctionName: process.env.APOLOGISE_FUNCTION,
      InvocationType: DRY_RUN ? "DryRun" : "Event",
      Payload: JSON.stringify(lambdaEvent),
    })
    .promise();
