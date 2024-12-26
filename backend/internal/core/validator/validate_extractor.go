package validator

import (
	"io"
	"net/http"

	"github.com/PuerkitoBio/goquery"
	"github.com/jhiven/online-mis-wrapper/internal/core/errs"
)

func ParseAndValidateExtractor(r io.Reader) (*goquery.Document, error) {
	doc, err := goquery.NewDocumentFromReader(r)
	if err != nil {
		return nil, errs.NewHTTPError(http.StatusInternalServerError, "Failed to parse html", err)

	}

	sessionValid := doc.Find("option[value='ociexecute(): ORA-00936: missing expression']").
		Length() == 0

	if !sessionValid {
		return nil, errs.NewHTTPError(http.StatusUnauthorized, "Unauthorized", nil)
	}

	return doc, nil
}
