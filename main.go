package main

import (
	_ "embed"
	"net/http"
)

//go:embed resume.pdf
var resume []byte

func main() {
	http.ListenAndServe(":80", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(resume)
	}))
}
