package errs

type HTTPError struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	Cause   string `json:"cause,omitempty"`
}

func (e *HTTPError) Error() string {
	return e.Message + ": " + e.Cause
}

func NewHTTPError(status int, message string, cause error) *HTTPError {
	if cause == nil {
		return &HTTPError{
			Status:  status,
			Message: message,
			Cause:   "",
		}
	}

	return &HTTPError{
		Status:  status,
		Message: message,
		Cause:   cause.Error(),
	}
}
