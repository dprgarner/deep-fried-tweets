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

# ids = [
#     status.id
#     for status in tweepy.Cursor(
#         api.user_timeline,
#         screen_name="thenecrowizzard",
#         since_id=1358063784498192386,
#         trim_user=True,
#         include_entities=False,
#     ).items()
# ]
# api.get_status(id=1380490608930914313)
