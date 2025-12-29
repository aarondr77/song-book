package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/mux"
)

type SearchResponse struct {
	Results []SearchResult `json:"results"`
}

type SearchResult struct {
	ID        int    `json:"id"`
	SongName  string `json:"song_name"`
	ArtistName string `json:"artist_name"`
	Type      string `json:"type"`
}

type TabResponse struct {
	ID        int    `json:"id"`
	SongName  string `json:"song_name"`
	ArtistName string `json:"artist_name"`
	Content   string `json:"content"`
	Type      string `json:"type"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := mux.NewRouter()
	r.HandleFunc("/search", corsMiddleware(searchHandler)).Methods("GET", "OPTIONS")
	r.HandleFunc("/tab/{id}", corsMiddleware(tabHandler)).Methods("GET", "OPTIONS")
	r.HandleFunc("/health", corsMiddleware(healthHandler)).Methods("GET", "OPTIONS")

	log.Printf("Starting server on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func searchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		respondError(w, http.StatusBadRequest, "Missing query parameter 'q'")
		return
	}

	results, err := SearchUltimateGuitar(query)
	if err != nil {
		log.Printf("Search error: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to search Ultimate Guitar")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(SearchResponse{Results: results})
}

func tabHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tab ID")
		return
	}

	tab, err := FetchTab(id)
	if err != nil {
		log.Printf("Fetch error: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to fetch tab")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tab)
}

func respondError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}

