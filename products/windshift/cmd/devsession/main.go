// Throwaway: mint a real session cookie for local browser testing. Not committed.
package main

import (
	"fmt"
	"log"

	"windshift/internal/auth"
	"windshift/internal/database"
)

func main() {
	db, err := database.NewSQLiteDB("windshift.db")
	if err != nil {
		log.Fatal(err)
	}
	sm := auth.NewSessionManager(db, false, false, nil, "dev-secret-for-testing", "")
	session, err := sm.CreateSession(1, "127.0.0.1", "devsession-tool", false)
	if err != nil {
		log.Fatal(err)
	}
	cookieValue, err := sm.EncodeSessionCookieValue(session.Token)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(cookieValue)
}
