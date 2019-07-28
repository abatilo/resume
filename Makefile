SHELL := /bin/bash

LOCAL_CONTAINER = abatilo/resume-builder
CONTAINER_NAME = resume
TAG = $(shell cat version.txt)
FULL_TAG = $(REGISTRY_URL)/$(CONTAINER_NAME):$(TAG)

.PHONY: help
help: ## View help information
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: login
login:
	echo $(REGISTRY_PASS) | docker login $(REGISTRY_URL) -u $(REGISTRY_USER) --password-stdin

.PHONY: build
build: ## Build the nginx container for serving my resume
	docker build -t $(FULL_TAG) .

.PHONY: push
push: login build ## Push the container to the configured docker registry
	docker push $(FULL_TAG)

.PHONY: run
run: build ## Run nginx container
	docker run -p8000:80 $(FULL_TAG)

.PHONY: build_local
build_local:
	docker build \
		-t $(LOCAL_CONTAINER) \
		-f Dockerfile.dev .

.PHONY: pdf
pdf: build_local
	docker run \
		-v `pwd`:/resume \
		-w /resume \
		-it $(LOCAL_CONTAINER) \
		bash -c 'pdflatex resume.tex'

.PHONY: png
png: pdf ## Used for building the png to display as part of the GH repo
	docker run \
		-v `pwd`:/resume \
		-w /resume \
		-it $(LOCAL_CONTAINER) \
		bash -c \
		'sed -i "s/rights=\"none\" pattern=\"PDF\"/rights=\"read|write\" pattern=\"PDF\"/" /etc/ImageMagick-6/policy.xml && convert -density 300 resume.pdf -quality 90 -strip resume.png'

.PHONY: clean
clean: resume.aux resume.log resume.out resume.pdf resume.png
	rm -rf $?
