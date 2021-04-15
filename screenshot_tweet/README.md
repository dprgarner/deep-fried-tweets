# Screenshot Tweet

```bash
docker build -t screenshot-tweet .
docker run -p 9000:8080 screenshot-tweet
echo '{}' | http POST :9000/2015-03-31/functions/function/invocations
```
