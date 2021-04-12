import json

from twitter_py import app


def test_process_mentions():
    ret = app.process_mentions(
        {
            "id": "cdc73f9d-aea9-11e3-9d5a-835b769c0d9c",
            "detail-type": "Scheduled Event",
            "source": "aws.events",
            "account": "123456789012",
            "time": "1970-01-01T00:00:00Z",
            "region": "us-east-1",
            "resources": ["arn:aws:events:us-east-1:123456789012:rule/ExampleRule"],
            "detail": {},
        },
        "",
    )
    data = json.loads(ret["body"])

    assert ret["statusCode"] == 200
    assert "message" in ret["body"]
    assert data["message"] == "hello."
    # assert "location" in data.dict_keys()
