FROM amazonlinux:latest

WORKDIR /root

# # Possibly needed?
# RUN yum -y update \
#     && yum -y groupinstall "Development Tools" \
#     && yum install -y \
#     \
#     gcc-c++ \
#     cairo-devel \
#     libjpeg-turbo-devel \
#     pango-devel \
#     giflib-devel \
#     \
#     && mkdir ./lib \
#     && cp $LIBS/libblkid.so.1 ./lib \
#     && cp $LIBS/libmount.so.1 ./lib \
#     && cp $LIBS/libuuid.so.1 ./lib \
#     && cp $LIBS/libfontconfig.so.1 ./lib \
#     && cp $LIBS/libpixman-1.so.0 ./lib

# Probably not needed?
# && yum install -y nodejs cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel

# A bunch of libraries I globbed from the following links:
# https://github.com/jwerre/node-canvas-lambda
# https://github.com/Automattic/node-canvas/wiki/Installation:-AWS-Lambda
RUN yum -y update \
    && yum groupinstall "Development Tools" -y \
    && yum install -y libuuid-devel libmount-devel zlib cairo-devel libjpeg-turbo-devel giflib-devel pango-devel \
    && mkdir ./lib \
    && (cp /usr/lib64/{libuuid.so.1,libmount.so.1,libblkid.so.1,libz.so.1,libpng12.so.0,libjpeg.so.62,libpixman-1.so.0,libfreetype.so.6,libcairo.so.2,libpango-1.0.so.0,libpangocairo-1.0.so.0,libpangoft2-1.0.so.0} ./lib || true)

CMD ["/bin/sh", "-c", "cp ./lib/* ./dist/"]
