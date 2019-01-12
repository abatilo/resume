FROM ubuntu:18.04

RUN ln -snf /usr/share/zoneinfo/Etc/UTC /etc/localtime \
    && echo "Etc/UTC" > /etc/timezone
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      texlive-fonts-recommended=2017.20180305-1 \
      texlive-plain-generic=2017.20180305-2 \
      texlive-latex-extra=2017.20180305-2 \
      ghostscript=9.26~dfsg+0-0ubuntu0.18.04.3 \
      imagemagick=8:6.9.7.4+dfsg-16ubuntu6.4 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
