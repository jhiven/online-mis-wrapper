package httprequest

import (
	"io"
	"net/http"
	"net/http/cookiejar"
	"time"
)

type HttpRequest struct {
	Client *http.Client
	Method string
	Path   string
	Body   io.Reader
	Header http.Header
}

func NewClient() *http.Client {
	client := &http.Client{
		Timeout: 3 * time.Minute,
		Transport: &http.Transport{
			TLSHandshakeTimeout:   3 * time.Minute,
			ResponseHeaderTimeout: 3 * time.Minute,
			ExpectContinueTimeout: 3 * time.Minute,
		},
	}

	return client
}

func NewClientWithJar() (*http.Client, error) {
	jar, err := cookiejar.New(nil)
	if err != nil {
		return nil, err
	}

	client := &http.Client{
		Jar:     jar,
		Timeout: 3 * time.Minute,
		Transport: &http.Transport{
			TLSHandshakeTimeout:   3 * time.Minute,
			ResponseHeaderTimeout: 3 * time.Minute,
			ExpectContinueTimeout: 3 * time.Minute,
		},
	}

	return client, nil
}

func (hr HttpRequest) Request() (*http.Response, error) {
	if hr.Client == nil {
		panic("client is nil")
	}
	if hr.Method == "" {
		panic("method is empty")
	}
	if hr.Path == "" {
		panic("path is empty")
	}
	if hr.Header == nil {
		hr.Header = http.Header{}
	}

	req, err := http.NewRequest(hr.Method, hr.Path, hr.Body)
	if err != nil {
		return nil, err
	}

	hr.Header.Add(
		"User-Agent",
		"Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
	)
	req.Header = hr.Header

	res, err := hr.Client.Do(req)
	if err != nil {
		return nil, err
	}

	return res, nil
}
