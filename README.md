# Deep Fried Tweets

## Take a screenshot with Chrome

```bash
docker container run -it --rm -v $(pwd):/usr/src/app zenika/alpine-chrome --no-sandbox --screenshot --hide-scrollbars --force-device-scale-factor=2 --window-size=480,600 https://github.com/Zenika/alpine-chrome
```

## Deploy the sample application

```bash
sam build --use-container
sam deploy --guided
```

The SAM CLI installs dependencies defined in `hello_world/requirements.txt`, creates a deployment package, and saves it in the `.aws-sam/build` folder.

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

## Test a lambda

Get the table Physical ID:

```bash
aws cloudformation describe-stack-resource --stack-name deepfriedtweets --logical-resource-id DeepFriedTable
```

Add to the env, and run the lambda directly:

```bash
GAMES_TABLE=deepfriedtweets-DeepFriedTable-AAAAAAAA sam local invoke MutationAddMessageFunction --event events/addMessage.json
```

This will run the built version of the lambda in `./aws-sam`.

To avoid having to build on small lambda changes, first delete the build directory:

```
rm -rf ./aws-sam
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
