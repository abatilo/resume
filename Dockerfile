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
COPY resume.tex .
RUN pdflatex resume.tex

FROM golang:1.17-alpine as server
WORKDIR /resume
COPY main.go .
COPY --from=builder /resume/resume.pdf .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /go/bin/resume main.go

FROM scratch
COPY --from=server /go/bin/resume /usr/local/bin/resume
ENTRYPOINT ["resume"]
EXPOSE 80
