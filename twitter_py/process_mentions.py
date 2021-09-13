import json
import os

import tweepy

DRY_RUN = os.getenv("DRY_RUN") == "true"


def get_mentions_since(twitter_api, since_id):
    statuses = tweepy.Cursor(
        twitter_api.mentions_timeline,
        since_id=since_id,
        trim_user=False,
        include_entities=False,
    ).items()
    for status in reversed(list(statuses)):
        yield status


def _is_retweet(status):
    return bool(getattr(status, "retweeted_status", None))


def _is_reply(status):
    return bool(getattr(status, "in_reply_to_status_id", None))


def _parse_status(status):
    parsed = {
        "id": status.id_str,
        "user": {
            "id": status.user.id_str,
            "screen_name": status.user.screen_name,
        },
        "text": status.text,
        "url": "https://www.twitter.com/{}/status/{}".format(
            status.user.screen_name,
            status.id_str,
        ),
        "possibly_sensitive": getattr(status, "possibly_sensitive", False),
    }
    assert parsed["user"]["id"]
    assert parsed["user"]["screen_name"]
    return parsed


def to_event(target, mention):
    return {
        "is_reply": _is_reply(mention),
        "mention": _parse_status(mention),
        "target": _parse_status(target),
    }


def process_mention(twitter_api, lambda_client, mention):
    print("Found mention:", mention.id_str)

    if _is_retweet(mention):
        print("Tweet is a retweet - skipping.")
        return

    if _is_reply(mention):
        print("mention is a reply - looking up target")
        target = twitter_api.get_status(
            id=mention.in_reply_to_status_id_str,
            trim_user=False,
            include_entities=False,
        )
    else:
        target = mention

    if target.user.id_str == os.getenv("BOT_USER_ID"):
        print("Bot should never deep fry its own tweet - skipping.")
        return

    print("attempting screenshot...")
    lambda_event = to_event(target, mention)
    lambda_client.invoke(
        FunctionName=os.getenv("SCREENSHOT_TWEET_FUNCTION"),
        InvocationType="DryRun" if DRY_RUN else "Event",
        Payload=json.dumps(lambda_event),
    )
