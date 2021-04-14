# Deep Fried Tweets

## TODO

- Split off debugging testing lambda from real lambda?

## Take a screenshot with Chrome

Lambdas can run containers now!
https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/

```bash
docker container run -it --rm -v $(pwd):/usr/src/app zenika/alpine-chrome --no-sandbox --screenshot --hide-scrollbars --force-device-scale-factor=2 --window-size=480,600 https://github.com/Zenika/alpine-chrome
```

## Deploy the sample application

```bash
sam build --use-container
sam deploy --guided
```

The SAM CLI installs dependencies defined in `hello_world/requirements.txt`, creates a deployment package, and saves it in the `.aws-sam/build` folder.

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

## Test a lambda

Add the following variables to .env.json file:

```json
{
  "Parameters": {
    "DEEP_FRIED_TABLE": "deep-fried-table"
  }
}
```

The table Physical ID can be found in the Console or by querying on the CLI:

```bash
aws cloudformation describe-stack-resource --stack-name deepfriedtweets --logical-resource-id DeepFriedTable
```

Invoke the Lambda function:

```bash
sam local invoke ProcessMentionsFunction --env-vars .env.json --event events/scheduled.json
```

This will run the built version of the lambda in `./aws-sam`.

The lambda function will need to be rebuilt each time:

```
sam build --use-container && sam local invoke ProcessMentionsFunction --env-vars .env.json --event events/scheduled.json
```

## Tests

Tests are defined in the `tests` folder in this project. Use PIP to install the test dependencies and run tests.

```bash
pip install -r tests/requirements.txt
python -m pytest tests/unit -v
AWS_SAM_STACK_NAME=deepfriendmemes python -m pytest tests/integration -v
```

## Cleanup

To delete the sample application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name sam-app
```
