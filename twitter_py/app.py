import os
import datetime

import tweepy
import boto3

dynamodb_client = boto3.client("dynamodb")


def get_twitter_api():
    twitter_auth = dynamodb_client.get_item(
        TableName=os.getenv("TABLE_NAME"), Key={"id": {"S": "twitter_auth"}}
    )["Item"]
    auth = tweepy.OAuthHandler(
        twitter_auth["consumer_key"]["S"], twitter_auth["consumer_secret"]["S"]
    )
    auth.set_access_token(
        twitter_auth["access_token"]["S"], twitter_auth["access_token_secret"]["S"]
    )
    return tweepy.API(auth)


twitter_api = get_twitter_api()


def _find_tweet_focus(status):
    if hasattr(status, "in_reply_to_screen_name"):
        return {
            "mention_id": status.id_str,
            "target_user": status.in_reply_to_screen_name,
            "target_id": status.in_reply_to_status_id_str,
        }
    return {
        "mention_id": status.id_str,
        "target_user": status.user.screen_name,
        "target_id": status.id_str,
    }


def process_mentions(_event, _context):
    """
    Get the Twitter bot's mentions, and execute lambda handler events for each of them.
    """
    last_request = dynamodb_client.get_item(
        TableName=os.getenv("TABLE_NAME"), Key={"id": {"S": "last_request"}}
    )
    since_id = last_request.get("Item", {}).get("since_id", {}).get("S")

    statuses = tweepy.Cursor(
        twitter_api.mentions_timeline,
        since_id=since_id,
        trim_user=True,
        include_entities=False,
    ).items()
    try:
        for status in reversed(list(statuses)):
            # Invoke a lambda to process it, here.
            print("Processing tweet:", _find_tweet_focus(status.id_str))
            since_id = status.id_str
    finally:
        current_time = (
            datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc).isoformat()
        )
        dynamodb_client.update_item(
            TableName=os.getenv("TABLE_NAME"),
            Key={"id": {"S": "last_request"}},
            AttributeUpdates={
                "since_id": {
                    "Value": {"S": since_id},
                    "Action": "PUT",
                },
                "datetime": {
                    "Value": {"S": current_time},
                    "Action": "PUT",
                },
            },
        )
