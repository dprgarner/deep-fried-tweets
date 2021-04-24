import traceback
import boto3

from dynamodb import get_since_id, set_since_id, get_twitter_api
from process_mentions import (
    get_mentions_since,
    process_mention,
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
        for mention in get_mentions_since(twitter_api, since_id):
            try:
                process_mention(twitter_api, lambda_client, mention)
            except Exception as e:
                traceback.print_exc()
            new_since_id = mention.id_str
    finally:
        set_since_id(dynamodb_client, new_since_id)


def reply(_event, _context):
    """
    Replies to the Twitter mention.
    TODO.
    """
    return {}
