#!/bin/bash -e

# This script builds the binaries used by Node Canvas and copies them into
# `./deep_fry/lib`. This is then bundled in with the rest of the deployable
# lambda when the `deep_fry` lambda is built.

SCRIPT_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

VERSION=12

cd $SCRIPT_DIR
docker build \
    --build-arg NODE_VERSION="$VERSION" \
    -t canvas-layers .

TARGET=$(cd ../deep_fry > /dev/null && pwd)/lib
rm -rf $TARGET
docker run --rm \
    -v $TARGET:/root/dist \
    canvas-layers

echo "Copied libraries to $TARGET"
