# Deep Fried Tweets

## Getting started

First, install SAM and Docker, and run the following:

```bash
./deep_fry/libs/build.sh
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
            "Value": {"S": "aaaaaaaa"},
        },
        "consumer_secret": {
            "Value": {"S": "aaaaaaaa"},
        },
        "access_token": {
            "Value": {"S": "aaaaaaaa"},
        },
        "access_token_secret": {
            "Value": {"S": "aaaaaaaa"},
        },
    },
)
```

## Manually test the individual functions

### Twitter API

```bash
cd twitter_py
# Set up an env for Python 3.8
pip install -r requirements.txt
python
```

In the python shell:

```py
from test import *
```

### screenshot_tweet

```bash
cd screenshot_tweet
npm install
cat ../events/screenshot.json | node test.js
```

### deep_fry

```bash
./deep_fry_libs/build.sh  # If this hasn't been run already
cd deep_fry
npm install
cat ../events/deep_fry.json | node test.js
```

## Run a lambda in a local environment imitating AWS

Add the following variables to .env.json file:

```json
{
  "Parameters": {
    "TWITTER_CONSUMER_KEY": "aaaaaaaa",
    "TWITTER_CONSUMER_SECRET": "aaaaaaaa",
    "TWITTER_ACCESS_TOKEN": "aaaaaaaa",
    "TWITTER_ACCESS_TOKEN_SECRET": "aaaaaaaa",
    "TABLE_NAME": "aaaaaaaa",
    "BUCKET_NAME": "aaaaaaaa",
    "SCREENSHOT_TWEET_FUNCTION": "aaaaaaaa",
    "DEEP_FRY_FUNCTION": "aaaaaaaa"
  }
}
```

The values of these fields can be found from the stack deployment output variables.

To invoke a Lambda function:

```bash
sam local invoke ProcessMentionsFunction --env-vars .env.json --event events/scheduled.json
```

This will run the built version of the lambda in `./aws-sam`. In general, invoking a lambda function will invoke the other downstream lambdas.

Lambda functions need to be rebuilt each time:

```
sam build --use-container ProcessMentionsFunction && sam local invoke ProcessMentionsFunction --env-vars .env.json --event events/scheduled.json
```

## Cleanup

To delete the sample application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name sam-app
```
