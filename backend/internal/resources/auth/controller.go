package auth

import (
	"errors"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"
	hr "github.com/jhiven/online-mis-wrapper/internal/core/http_request"
)

type AuthController struct {
	client *http.Client
}

type loginResponse struct {
	PHPSESSID  *http.Cookie `json:"-"`
	UserCookie *http.Cookie `json:"-"`
	User       string       `json:"user"`
	NRP        string       `json:"nrp"`
}

func (c *AuthController) getLtCas() (sessionId, lt string, err error) {
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

func (c *AuthController) LoginCas(loginData LoginPayload) (*loginResponse, error) {
	sessionId, lt, err := c.getLtCas()
	if err != nil {
		return nil, err
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
		return nil, err
	}
	defer func() {
		if err := res.Body.Close(); err != nil {
			slog.Error("Failed to close body", "error", err)
		}
	}()
	if res.StatusCode != 200 {
		return nil, err
	}

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		return nil, err
	}

	if loginErr := doc.Find(".errors"); loginErr.Length() > 0 {
		return nil, errors.New(loginErr.Text())
	}

	user := strings.TrimSpace(strings.Split(doc.Find(".userout a").Text(), ":")[1])

	regex := regexp.MustCompile(`^(.*?)\s*\(`)
	userName := regex.FindStringSubmatch(user)[1]

	regex = regexp.MustCompile(`\(([^)]+)\)`)
	nrp := regex.FindStringSubmatch(user)[1]

	userCookie := &http.Cookie{
		Name:     "nrp",
		Value:    nrp,
		HttpOnly: true,
		Secure:   false,
	}

	phpSessId := c.client.Jar.Cookies(&url.URL{Scheme: "https", Host: "online.mis.pens.ac.id"})[0]
	phpSessId.HttpOnly = true
	phpSessId.Secure = false

	return &loginResponse{
		PHPSESSID:  phpSessId,
		UserCookie: userCookie,
		User:       userName,
		NRP:        nrp,
	}, nil
}
