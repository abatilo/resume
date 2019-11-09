FROM ubuntu:18.04 as pdf

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

FROM golang:1.12.13-alpine as builder
ENV GO111MODULE=on

RUN apk add --no-cache \
      git=2.22.0-r0 \
      ca-certificates=20190108-r0
RUN go get github.com/gobuffalo/packr/v2/packr2@v2.7.1

WORKDIR /app
COPY go.mod go.sum /app/
RUN go mod download

COPY cmd /app/cmd
COPY --from=pdf /resume/resume.pdf /app/website/resume.pdf
RUN cd /app/cmd/resume && packr2
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/resume ./cmd/resume/

FROM scratch
COPY --from=builder /app/resume /resume
EXPOSE 8080
ENTRYPOINT ["/resume"]
