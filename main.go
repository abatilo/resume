package main

import (
	_ "embed"
	"net/http"
)

//go:embed resume.pdf
var resume []byte

func main() {
	http.ListenAndServe(":80", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "public, max-age=172800")
		w.Header().Set("Content-Type", "application/pdf")
		w.Write(resume)
	}))
}
