package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

// SearchUltimateGuitar searches for songs on Ultimate Guitar
func SearchUltimateGuitar(query string) ([]SearchResult, error) {
	// Using Ultimate Guitar's mobile API endpoint
	baseURL := "https://www.ultimate-guitar.com/api/v1/tab"
	
	params := url.Values{}
	params.Add("query", query)
	params.Add("page", "1")
	params.Add("type", "Chords")
	
	fullURL := fmt.Sprintf("%s/search?%s", baseURL, params.Encode())
	
	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return nil, err
	}
	
	// Set headers to mimic mobile app
	req.Header.Set("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15")
	req.Header.Set("Accept", "application/json")
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	var apiResponse struct {
		Results []struct {
			ID        int    `json:"id"`
			SongName  string `json:"song_name"`
			ArtistName string `json:"artist_name"`
			Type      string `json:"type"`
		} `json:"results"`
	}
	
	if err := json.Unmarshal(body, &apiResponse); err != nil {
		return nil, err
	}
	
	results := make([]SearchResult, len(apiResponse.Results))
	for i, r := range apiResponse.Results {
		results[i] = SearchResult{
			ID:         r.ID,
			SongName:   r.SongName,
			ArtistName: r.ArtistName,
			Type:       r.Type,
		}
	}
	
	return results, nil
}

// FetchTab fetches a specific tab by ID from Ultimate Guitar
func FetchTab(id int) (*TabResponse, error) {
	// Using Ultimate Guitar's mobile API endpoint
	baseURL := fmt.Sprintf("https://www.ultimate-guitar.com/api/v1/tab/%d", id)
	
	req, err := http.NewRequest("GET", baseURL, nil)
	if err != nil {
		return nil, err
	}
	
	// Set headers to mimic mobile app
	req.Header.Set("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15")
	req.Header.Set("Accept", "application/json")
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	var apiResponse struct {
		ID        int    `json:"id"`
		SongName  string `json:"song_name"`
		ArtistName string `json:"artist_name"`
		Content   string `json:"content"`
		Type      string `json:"type"`
	}
	
	if err := json.Unmarshal(body, &apiResponse); err != nil {
		return nil, err
	}
	
	// Clean up the content - remove HTML tags if present
	content := strings.TrimSpace(apiResponse.Content)
	
	return &TabResponse{
		ID:         apiResponse.ID,
		SongName:   apiResponse.SongName,
		ArtistName: apiResponse.ArtistName,
		Content:    content,
		Type:       apiResponse.Type,
	}, nil
}

