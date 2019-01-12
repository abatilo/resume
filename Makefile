all: clean png

build:
	docker build -t latex -f Dockerfile .

pdf: build
	docker run -v /home/aaron/abatilo/resume:/resume -w /resume -it latex bash -c 'pdflatex resume.tex'

png: pdf
	docker run -v /home/aaron/abatilo/resume:/resume -w /resume -it latex bash -c \
		'sed -i "s/rights=\"none\" pattern=\"PDF\"/rights=\"read|write\" pattern=\"PDF\"/" /etc/ImageMagick-6/policy.xml && convert -density 300 resume.pdf -quality 90 -strip resume.png'

clean: resume.aux resume.log resume.out resume.pdf resume.png
	rm -rf $?
