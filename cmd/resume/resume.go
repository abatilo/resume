package main

import (
	"fmt"
	"net/http"

	"github.com/gobuffalo/packr/v2"
)

func main() {
	box := packr.New("resume", "../../website")
	pdf, err := box.Find("resume.pdf")

	if err != nil {
		fmt.Printf("%v\n", err)
	}

	http.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		res.Write(pdf)
	})
	http.HandleFunc("/resume", func(res http.ResponseWriter, req *http.Request) {
		res.Write(pdf)
	})
	http.HandleFunc("/resume.pdf", func(res http.ResponseWriter, req *http.Request) {
		res.Write(pdf)
	})

	fmt.Println("Starting on :8080...")
	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Printf("%v\n", err)
	}
}
