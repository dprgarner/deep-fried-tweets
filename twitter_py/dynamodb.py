import datetime
import os

import tweepy


def get_credentials(dynamodb_client):
    return dynamodb_client.get_item(
        TableName=os.getenv("TABLE_NAME"), Key={"id": {"S": "twitter_auth"}}
    )["Item"]


def get_since_id(dynamodb_client):
    last_request = dynamodb_client.get_item(
        TableName=os.getenv("TABLE_NAME"), Key={"id": {"S": "last_request"}}
    )
    since_id = last_request.get("Item", {}).get("since_id", {}).get("S")
    return since_id


def set_since_id(dynamodb_client, since_id):
    current_time = (
        datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc).isoformat()
    )
    attribute_updates = {
        "datetime": {
            "Value": {"S": current_time},
            "Action": "PUT",
        },
    }
    if since_id:
        attribute_updates["since_id"] = {
            "Value": {"S": since_id},
            "Action": "PUT",
        }
    dynamodb_client.update_item(
        TableName=os.getenv("TABLE_NAME"),
        Key={"id": {"S": "last_request"}},
        AttributeUpdates=attribute_updates,
    )


def get_twitter_api(dynamodb_client):
    credentials = get_credentials(dynamodb_client)
    auth = tweepy.OAuthHandler(
        credentials["consumer_key"]["S"], credentials["consumer_secret"]["S"]
    )
    auth.set_access_token(
        credentials["access_token"]["S"], credentials["access_token_secret"]["S"]
    )
    return tweepy.API(auth)
