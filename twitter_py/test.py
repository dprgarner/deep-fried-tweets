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

api = tweepy.API(auth)


def get_dank_tweets():
    # A list of tweets including a private status.
    for s in api.statuses_lookup(
        ["1383772550254133250", "1383772620114464768", "1383774998226112517"],
        trim_user=False,
        include_entities=False,
    ):
        yield s

    # For testing.
    for status in api.search(
        "dank", lang="en", trim_user=False, include_entities=False, count=30
    ):
        yield status
