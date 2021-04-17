const S3 = require("aws-sdk/clients/s3");

const deepFry = require("./deep_fry");

const s3Client = new S3({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  const result = await deepFry(event, { s3Client });

  console.log(result);
};
