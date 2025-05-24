package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

  "routine-tracker/router"
	"github.com/gorilla/mux"
	"routine-tracker/database"
)

var testRouter *mux.Router

func TestMain(m *testing.M) {
	// Setup test database
	os.Remove("./test.db") // Remove any existing test db

	// Initialize test database
	if err := database.InitTest("./test.db"); err != nil {
		panic("Failed to initialize test database: " + err.Error())
	}
  testRouter = router.Setup()
	// Run tests
	code := m.Run()

	// Cleanup
	database.Close()
	os.Remove("./test.db")

	os.Exit(code)
}

// Helper function to make HTTP requests
func makeRequest(method, url string, body interface{}) (*httptest.ResponseRecorder, error) {
	var reqBody *bytes.Buffer

	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewBuffer(jsonBody)
	} else {
		reqBody = bytes.NewBuffer([]byte{})
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	testRouter.ServeHTTP(rr, req)

	return rr, nil
}
