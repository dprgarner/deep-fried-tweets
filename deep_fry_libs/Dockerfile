FROM amazonlinux:latest

WORKDIR /root

# Probably not needed?
# && yum install -y nodejs cairo cairomm-devel pango pangomm

# A bunch of libraries I globbed from the following links:
# https://github.com/jwerre/node-canvas-lambda
# https://github.com/Automattic/node-canvas/wiki/Installation:-AWS-Lambda
RUN yum -y update \
    && yum groupinstall "Development Tools" -y \
    && yum install -y libuuid-devel libmount-devel zlib cairo-devel-1.15.12-4.amzn2.x86_64 libjpeg-turbo-devel giflib-devel pango-devel \
    && mkdir ./lib

RUN (cp /usr/lib64/{libEGL.so.1,libGL.so.1,libX11.so.6,libXext.so.6,libXrender.so.1,libblkid.so.1,libcairo.so.2,libfontconfig.so.1,libfreetype.so.6,libjpeg.so.62,libmount.so.1,libpango-1.0.so.0,libpangocairo-1.0.so.0,libpangoft2-1.0.so.0,libpixman-1.so.0,libpng15.so.15,libuuid.so.1,libxcb-render.so.0,libxcb-shm.so.0,libxcb.so.1,libz.so.1,libthai.so.0,libfribidi.so.0} ./lib)
# RUN cp -r /usr/lib64/** ./lib/

CMD ["/bin/sh", "-c", "cp -fr ./lib/** ./dist/ || true"]
