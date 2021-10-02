# Deep Fried Tweets

The source code for the Twitter bot [@deepfryplz][bot], which [deep fries][gis] tweets whenever it's mentioned. Extra crispy.

[gis]: https://www.google.com/search?q=deep+fried+memes&tbm=isch
[bot]: https://twitter.com/deepfryplz

## Overview

This is an [AWS SAM][sam] project composed of the following lambdas:

- `ProcessMentionsFunction` is a Python lambda which runs periodically. It checks Twitter for any places where the bot is mentioned and invokes `ScreenshotFunction` every time an eligible tweet is mentioned.
- `ScreenshotFunction` is a JavaScript lambda using Chromium and Puppeteer. This renders and uploads screenshots of the tweets to S3, identifies the positions of parts of the tweet, and then invokes `DeepFryFunction`.
- `DeepFryFunction` is a JavaScript lambda using [Node Canvas][canvas] and [Fabric][fabric]. This generates randomised parameters to deep fry the tweet, applies these parameters, uploads the deep fried tweet to S3, and then invokes `ReplyFunction`.
- `ReplyFunction` is a Python lambda. It uploads the deep fried tweet replies to the original mention.
- `ApologiseFunction` is a Python lambda which is invoked if any of the above steps fail, informing the user mentioning the bot that something went wrong.

The stack also contains an S3 bucket for the images and a DynamoDB database for keeping credentials and user records to prevent abuse.

[sam]: https://aws.amazon.com/serverless/sam/
[canvas]: https://github.com/Automattic/node-canvas
[fabric]: http://fabricjs.com/

## Development

### Getting started

Install SAM and Docker, and run the following:

```bash
sam build --use-container
sam deploy --guided
```

After deploying, the Twitter API keys from the app need to be added in a DynamoDB document. Twitter API details need to be set up by registering an app, and following the OAuth 1A authentication process: https://docs.tweepy.org/en/latest/auth_tutorial.html#oauth-1a-authentication

```py
import boto3

dynamodb_client = boto3.client("dynamodb")
dynamodb_client.put_item(
    TableName=os.getenv("DEEP_FRIED_TABLE"),
    Key={"id": {"S": "twitter_auth"}},
    AttributeUpdates={
        "consumer_key": {
            "Value": {"S": "your consumer key"},
        },
        "consumer_secret": {
            "Value": {"S": "your consumer secret"},
        },
        "access_token": {
            "Value": {"S": "your access token"},
        },
        "access_token_secret": {
            "Value": {"S": "your access token secret"},
        },
    },
)
```

### Manually test the individual functions locally

#### Twitter API

Set up a local Python 3.8 virtual environment, and run:

```bash
pip install -r twitter_py/requirements.txt
cd twitter_py
python
```

In the python shell:

```py
from test import *
```

#### screenshot_tweet

```bash
cd screenshot_tweet
npm install
cat ../events/screenshot_tweet.json | node test.js
```

#### deep_fry

```bash
cd deep_fry
npm install
cat ../events/deep_fry.json | node test.js
```

### Run a lambda in a local environment using SAM CLI

Add the following variables to .env.json file:

```json
{
  "Parameters": {
    "DRY_RUN": "true",
    "TWITTER_CONSUMER_KEY": "aaaaaaaa",
    "TWITTER_CONSUMER_SECRET": "aaaaaaaa",
    "TWITTER_ACCESS_TOKEN": "aaaaaaaa",
    "TWITTER_ACCESS_TOKEN_SECRET": "aaaaaaaa",
    "BOT_USER_ID": "111111111111111111",
    "MAINTAINER_USER_ID": "111111111111111111",
    "TABLE_NAME": "aaaaaaaa",
    "BUCKET_NAME": "aaaaaaaa",
    "SCREENSHOT_TWEET_FUNCTION": "aaaaaaaa",
    "DEEP_FRY_FUNCTION": "aaaaaaaa",
    "REPLY_FUNCTION": "aaaaaaaa"
  }
}
```

The values of the AWS-specific fields can be found from the output variables of the stack deployment.

To build and invoke a single Lambda function:

```
sam build --use-container ProcessMentionsFunction && sam local invoke ProcessMentionsFunction --env-vars .env.json --event events/scheduled.json
```

This will run the built version of the lambda in `./aws-sam` in a Docker container emulating the Lambda environment. The lambda function will need rebuilding on changes.

⚠️ **The `DeepFry` lambda does not work with `sam local invoke`**. This is because it uses a Layer hosted on an S3 bucket, which cannot be invoked locally in the AWS Lambda emulator environment.

To prevent the locally-run lambdas from invoking downstream lambdas, set `DRY_RUN` to `true` in the env variables.

### Grab a bunch of random tweets and deep-fry them without actually uploading them anywhere or tweeting at people

```bash
./e2e.sh
```

### Get logs

```
sam logs -n ReplyFunction --stack-name deep-fried-tweets
```

### Cleanup

To delete the sample application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name deep-fried-tweets
```
