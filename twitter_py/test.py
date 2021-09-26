"""
A test file for trying out some Twitter API calls locally without requiring a
Lambda to be built.


Usage:

from test import *
scrub_tweets("dank")
"""
import json
import tweepy

from process_mentions import to_event, is_reply, is_retweet


with open("../.env.json") as env_file:
    env = json.load(env_file)["Parameters"]
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
    for status in twitter_api.lookup_statuses(
        ["1441109206388535304"],
        trim_user=False,
        include_entities=False,
    ):
        yield status

    # For testing.
    for status in twitter_api.search_tweets(
        "dank", lang="en", trim_user=False, include_entities=False, count=30
    ):
        yield status


def tweets_to_events(results):
    events = []
    for mention in results:
        if is_reply(mention) and not is_retweet(mention):
            target = twitter_api.get_status(
                id=mention.in_reply_to_status_id_str,
                trim_user=False,
                include_entities=False,
            )
        else:
            target = mention
        events.append(to_event(target, mention))
        if len(events) == 10:
            break

    with open("../events/screenshot_gen.json", "w") as events_file:
        json.dump(events, events_file, indent=2)


def scrub_tweets(search_term):
    results = twitter_api.search_tweets(search_term, lang="en", count=20)
    tweets_to_events(results)
