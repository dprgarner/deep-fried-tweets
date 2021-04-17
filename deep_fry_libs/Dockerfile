# Adapted from:
# https://github.com/jwerre/node-canvas-lambda

FROM amazonlinux:latest

ARG LIBS=/usr/lib64
ARG NODE_VERSION=12

# set up container
RUN yum -y update \
    && yum -y groupinstall "Development Tools" \
    && curl --silent --location https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && yum install -y nodejs gcc-c++ cairo-devel libjpeg-turbo-devel pango-devel giflib-devel
# && yum install -y nodejs cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel

RUN node --version

WORKDIR /root/nodejs

RUN npm install canvas@next \
    chartjs-plugin-datalabels \
    chartjs-node-canvas \
    chart.js

WORKDIR /root/lib

# gather missing libraries
RUN cp $LIBS/libblkid.so.1 . \
    && cp $LIBS/libmount.so.1 . \
    && cp $LIBS/libuuid.so.1 . \
    && cp $LIBS/libfontconfig.so.1 . \
    && cp $LIBS/libpixman-1.so.0 .


WORKDIR /root

RUN zip -r -9 node${NODE_VERSION}_canvas_layer.zip nodejs \
    && zip -r -9 node${NODE_VERSION}_canvas_lib64_layer.zip lib

CMD ["/bin/sh", "-c", "cp *.zip ./dist"]
