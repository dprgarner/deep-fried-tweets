import datetime
import json
import os

import tweepy


def get_twitter_api(dynamodb_client):
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


def get_since_id(dynamodb_client):
    last_request = dynamodb_client.get_item(
        TableName=os.getenv("TABLE_NAME"), Key={"id": {"S": "last_request"}}
    )
    since_id = last_request.get("Item", {}).get("since_id", {}).get("S")
    return since_id


def get_mentions_since(twitter_api, since_id):
    statuses = tweepy.Cursor(
        twitter_api.mentions_timeline,
        since_id=since_id,
        trim_user=True,
        include_entities=False,
    ).items()
    for status in reversed(list(statuses)):
        yield status


def set_since_id(dynamodb_client, since_id):
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


def screenshot_tweet(lambda_client, status):
    lambda_event = _find_tweet_focus(status.id_str)
    print("Invoking screenshot tweet:", lambda_event)

    response = lambda_client.invoke(
        FunctionName=os.getenv("SCREENSHOT_TWEET_FUNCTION"),
        # InvocationType='Event',
        InvocationType="DryRun",
        Payload=json.dumps(lambda_event),
    )
    print("Invoked lambda:", response)
