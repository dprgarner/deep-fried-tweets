#!/bin/bash -e

cd twitter_py > /dev/null
python -c "from test import *; scrub_tweets('${1:-lol}')"
cd .. > /dev/null

rm ./img/tweets/*.png || true
cat events/screenshot_gen.json  | node screenshot_tweet/test.js

rm ./img/fried/*.png || true
cat events/deep_fry_gen.json | node deep_fry/test.js
