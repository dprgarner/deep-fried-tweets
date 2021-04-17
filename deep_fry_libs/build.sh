#!/bin/bash -e

VERSION=12

docker build \
    --build-arg NODE_VERSION="$VERSION" \
    -t canvas-layers .

docker run --rm \
    -v $(pwd)/lib:/root/dist \
    canvas-layers
