package login

import (
	"errors"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"net/url"
	"strings"

	"github.com/PuerkitoBio/goquery"
	hr "github.com/jhiven/online-mis-wrapper/internal/core/http_request"
)

type LoginController struct {
	client *http.Client
}

func (c *LoginController) getLtCas() (sessionId, lt string, err error) {
	opt := hr.HttpRequest{
		Client: c.client,
		Method: http.MethodGet,
		Path:   "https://login.pens.ac.id/cas/login?service=https%3A%2F%2Fonline.mis.pens.ac.id%2Findex.php%3FLogin%3D1%26halAwal%3D1",
	}

	res, err := opt.Request()
	if err != nil {
		return "", "", err
	}
	defer func() {
		if err := res.Body.Close(); err != nil {
			log.Println("Failed to close response body:", err)
		}
	}()

	if res.StatusCode != 200 {
		return "", "", errors.New("Gagal login CAS, status code != 200")
	}
	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		return "", "", err
	}
	lt, exists := doc.Find("[name='lt']").Attr("value")
	if !exists {
		log.Fatalf("Element with name='lt' not found")
	}

	for _, c := range res.Cookies() {
		if c.Name == "JSESSIONID" {
			sessionId = c.Value
		}
	}

	return sessionId, lt, nil
}

func (c *LoginController) LoginCas(
	loginData LoginPayload,
) (phpSessId, userCookie *http.Cookie, err error) {
	sessionId, lt, err := c.getLtCas()

	if err != nil {
		return nil, nil, err
	}

	payload := url.Values{
		"username": {loginData.Email},
		"password": {loginData.Password},
		"_eventId": {"submit"},
		"submit":   {"LOGIN"},
		"lt":       {lt},
	}

	headers := http.Header{
		"Content-Type": {"application/x-www-form-urlencoded"},
		"Cookie":       {fmt.Sprintf("JSESSIONID=%s", sessionId)},
		"Connection":   {"keep-alive"},
		"Referer": {
			"https://login.pens.ac.id/cas/login?service=https%3A%2F%2Fonline.mis.pens.ac.id%2Findex.php%3FLogin%3D1%26halAwal%3D1",
		},
		"Origin": {"https://login.pens.ac.id"},
	}

	opt := hr.HttpRequest{
		Client: c.client,
		Method: http.MethodPost,
		Path:   "https://login.pens.ac.id/cas/login?service=https%3A%2F%2Fonline.mis.pens.ac.id%2Findex.php%3FLogin%3D1%26halAwal%3D1",
		Body:   strings.NewReader(payload.Encode()),
		Header: headers,
	}

	res, err := opt.Request()
	if err != nil {
		return nil, nil, err
	}
	defer func() {
		if err := res.Body.Close(); err != nil {
			slog.Error("Failed to close body", "error", err)
		}
	}()
	if res.StatusCode != 200 {
		return nil, nil, errors.New("Gagal login CAS, status code != 200")
	}

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		return nil, nil, err
	}

	if loginErr := doc.Find(".errors"); loginErr.Length() > 0 {
		return nil, nil, errors.New(loginErr.Text())
	}

	user := strings.TrimSpace(strings.Split(doc.Find(".userout a").Text(), ":")[1])

	userCookie = &http.Cookie{
		Name:     "user",
		Value:    user,
		HttpOnly: true,
		Secure:   false,
	}

	phpSessId = c.client.Jar.Cookies(&url.URL{Scheme: "https", Host: "online.mis.pens.ac.id"})[0]
	phpSessId.HttpOnly = true
	phpSessId.Secure = false

	return phpSessId, userCookie, nil
}
