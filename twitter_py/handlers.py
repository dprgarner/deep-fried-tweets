import boto3

from process_mentions import (
    get_since_id,
    get_twitter_api,
    get_mentions_since,
    set_since_id,
    screenshot_tweet,
)

dynamodb_client = boto3.client("dynamodb")
twitter_api = get_twitter_api(dynamodb_client)
lambda_client = boto3.client("lambda")


def process_mentions(_event, _context):
    """
    Get the Twitter bot's mentions, and execute lambda handler events for each of them.
    """
    since_id = get_since_id(dynamodb_client)
    new_since_id = since_id
    try:
        for status in get_mentions_since(twitter_api, since_id):
            screenshot_tweet(lambda_client, status)
            new_since_id = status.id_str
    finally:
        set_since_id(dynamodb_client, new_since_id)
