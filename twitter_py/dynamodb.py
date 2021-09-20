from datetime import datetime, timezone
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
    current_time = datetime.now(timezone.utc).isoformat()
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


def get_rap_sheet(dynamodb_client, user, cutoff):
    id_ = "rap_sheet:{}".format(user.id_str)
    rap_sheet_response = dynamodb_client.get_item(
        TableName=os.getenv("TABLE_NAME"),
        Key={"id": {"S": id_}},
    ).get("Item", {})

    recent_mentions = [
        datetime.fromisoformat(d)
        for d in rap_sheet_response.get("recent_mentions", {}).get("SS", [])
    ]
    recent_mentions_cutoff = [d for d in recent_mentions if d > cutoff]

    return {
        "id": id_,
        "recent_mentions": recent_mentions_cutoff,
    }


def update_rap_sheet(dynamodb_client, rap_sheet, user):
    current_time = datetime.now(timezone.utc)
    attribute_updates = {
        "recent_mentions": {
            "Value": {
                "SS": (
                    [s.isoformat() for s in rap_sheet["recent_mentions"]]
                    + [current_time.isoformat()]
                )
            },
            "Action": "PUT",
        },
        "screen_name": {"Value": {"S": user.screen_name}},
    }
    dynamodb_client.update_item(
        TableName=os.getenv("TABLE_NAME"),
        Key={"id": {"S": rap_sheet["id"]}},
        AttributeUpdates=attribute_updates,
    )
