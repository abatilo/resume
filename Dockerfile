FROM ubuntu:18.04 as builder

RUN ln -snf /usr/share/zoneinfo/Etc/UTC /etc/localtime \
    && echo "Etc/UTC" > /etc/timezone
# hadolint ignore=DL3008
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      texlive-fonts-recommended=2017.20180305-1 \
      texlive-plain-generic=2017.20180305-2 \
      texlive-latex-extra=2017.20180305-2 \
      ghostscript \
      imagemagick \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /resume
COPY . /resume/
RUN pdflatex resume.tex

FROM nginx:1.15.7-alpine
COPY --from=builder /resume/resume.pdf /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
