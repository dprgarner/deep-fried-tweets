import os
import json

# import requests
import boto3

dynamodb_client = boto3.client("dynamodb")


def process_mentions(_event, _context):
    """
    Get the Twitter bot's mentions, and dispatch queue events for each of them.
    """
    response = dynamodb_client.get_item(
        TableName=os.getenv("DEEP_FRIED_TABLE"), Key={"id": {"S": "last_request"}}
    )

    print(json.dumps(response, indent=2))
    # try:
    #     ip = requests.get("http://checkip.amazonaws.com/")
    # except requests.RequestException as e:
    #     # Send some context about this error to Lambda Logs
    #     print(e)

    #     raise e

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "message": "hello.",
                # "location": ip.text.replace("\n", "")
            }
        ),
    }
