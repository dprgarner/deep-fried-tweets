# Deep Fried Tweets

## Getting started

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

## Manually test the individual functions locally

### Twitter API

Set up a local Python 3.8 virtual environment, and run:

```bash
pip install -r twitter_py/requirements.txt
python
```

In the python shell:

```py
from twitter_py.test import *
```

### screenshot_tweet

```bash
cd screenshot_tweet
npm install
cat ../events/screenshot_tweet.json | node test.js
```

### deep_fry

```bash
cd deep_fry
npm install
cat ../events/deep_fry.json | node test.js
```

## Run a lambda in a local environment using SAM CLI

Add the following variables to .env.json file:

```json
{
  "Parameters": {
    "TWITTER_CONSUMER_KEY": "aaaaaaaa",
    "TWITTER_CONSUMER_SECRET": "aaaaaaaa",
    "TWITTER_ACCESS_TOKEN": "aaaaaaaa",
    "TWITTER_ACCESS_TOKEN_SECRET": "aaaaaaaa",
    "DRY_RUN": "true",
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

**The `DeepFry` lambda does not work with `sam local invoke`**. This is because it uses a Layer hosted on an S3 bucket, which cannot be invoked locally in the AWS Lambda emulator environment.

To prevent the locally-run lambdas from invoking downstream lambdas, set `DRY_RUN` to `true` in the env variables.

## Get logs

```
sam logs -n ReplyFunction  --stack-name deep-fried-tweets
```

## Cleanup

To delete the sample application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name deep-fried-tweets
```
