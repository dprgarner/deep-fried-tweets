from datetime import datetime
from random import choice
import io
import json
import os
import traceback
import tweepy

import boto3

from dynamodb import get_since_id, set_since_id, get_twitter_api
from process_mentions import (
    get_mentions_since,
    process_mention,
)


dynamodb_client = boto3.client("dynamodb")
s3_client = boto3.client("s3")
twitter_api = get_twitter_api(dynamodb_client)
lambda_client = boto3.client("lambda")


def tweet_nope(id_, screen_name, pm=True, msg="🤖 Beep boop. Something went wrong."):
    if pm:
        try:
            twitter_api.send_direct_message(
                os.getenv("MAINTAINER_USER_ID"),
                "Bot error -- status ID: {}".format(id_),
            )
        except Exception as e:
            print("Failed to PM an error report")
            traceback.print_exc()

    try:
        twitter_api.update_status(
            "@{} {}".format(screen_name, msg),
            in_reply_to_status_id=id_,
        )
    except Exception as e:
        print("Failed to tweet apology")
        traceback.print_exc()


def process_mentions(_event, _context):
    """
    Get the Twitter bot's mentions, and execute lambda handler events for each of them.
    """
    print("Invoked with event:", json.dumps(_event))

    since_id = get_since_id(dynamodb_client)
    new_since_id = since_id
    try:
        for mention in get_mentions_since(twitter_api, since_id):
            try:
                process_mention(twitter_api, lambda_client, dynamodb_client, mention)
            except tweepy.errors.Forbidden as e:
                print(e)
                tweet_nope(
                    mention.id_str,
                    mention.user.screen_name,
                    pm=False,
                    msg="Can't see that tweet",
                )
            except Exception as e:
                traceback.print_exc()
                tweet_nope(mention.id_str, mention.user.screen_name)
            new_since_id = mention.id_str
    finally:
        set_since_id(dynamodb_client, new_since_id)


ACKNOWLEDGEMENTS = [
    "👌",
    "Extra cris🅱️y",
    "Extra crispy 👌",
    "Perfect 👌",
    "Here you go",
    "🅱️eautiful",
    "Beautiful",
]


def reply(_event, _context):
    """
    Replies to the Twitter mention.
    """
    print("Invoked with event:", json.dumps(_event))

    try:
        with io.BytesIO(b"") as image_file:
            print("Downloading deep-fried image...")
            s3_client.download_fileobj(
                os.getenv("BUCKET_NAME"),
                _event["file"]["fried"],
                image_file,
            )
            image_file.seek(0)

            print("Downloaded deep-fried image. Uploading image to Twitter...")
            uploaded_image = twitter_api.media_upload(
                filename=_event["file"]["fried"],
                file=image_file,
                chunked=True,
            )

            print("Uploaded image to Twitter. Updating status...")
            acknowledgement = choice(ACKNOWLEDGEMENTS)
            possibly_sensitive = (
                _event["target"]["possibly_sensitive"]
                or _event["mention"]["possibly_sensitive"]
            )
            status_response = twitter_api.update_status(
                "@{} {}".format(
                    _event["mention"]["user"]["screen_name"], acknowledgement
                ),
                in_reply_to_status_id=_event["mention"]["id"],
                media_ids=[uploaded_image.media_id],
                possibly_sensitive=possibly_sensitive,
            )

            reply_time = status_response.created_at
            mention_time = datetime.fromisoformat(_event["mention"]["created_at"])
            response_time = (reply_time - mention_time).seconds
            print(
                "Status updated successfully in {} seconds: {}".format(
                    response_time, status_response.id_str
                )
            )
    except Exception as e:
        traceback.print_exc()
        tweet_nope(_event["mention"]["id"], _event["mention"]["user"]["screen_name"])


def apologise(_event, _context):
    tweet_nope(_event["mention"]["id"], _event["mention"]["user"]["screen_name"])
