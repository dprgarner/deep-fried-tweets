"""
A test file for trying out some Twitter API calls locally without requiring a
Lambda to be built.


Usage:

from twitter_py.test import *
from twitter_py.process_mentions import *

id_=1384831973156339713
status = twitter_api.get_status(id_)
process_mention(twitter_api, lambda_client, status)
"""
import json
import tweepy


with open(".env.json") as f:
    env = json.load(f)["Parameters"]
    auth = tweepy.OAuthHandler(
        env["TWITTER_CONSUMER_KEY"], env["TWITTER_CONSUMER_SECRET"]
    )
    auth.set_access_token(
        env["TWITTER_ACCESS_TOKEN"], env["TWITTER_ACCESS_TOKEN_SECRET"]
    )


class FakeLambda:
    def invoke(self, **kwargs):
        print(json.dumps(json.loads(kwargs["Payload"])))


twitter_api = tweepy.API(auth)
lambda_client = FakeLambda()


def get_dank_tweets():
    # A list of tweets including a private status.
    for status in twitter_api.statuses_lookup(
        ["1383772550254133250", "1383772620114464768", "1383774998226112517"],
        trim_user=False,
        include_entities=False,
    ):
        yield status

    # For testing.
    for status in twitter_api.search(
        "dank", lang="en", trim_user=False, include_entities=False, count=30
    ):
        yield status
