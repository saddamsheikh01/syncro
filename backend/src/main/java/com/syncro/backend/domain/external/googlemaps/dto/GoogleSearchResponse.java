package com.syncro.backend.domain.external.googlemaps.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GoogleSearchResponse {

    private List<GooglePlaceResponse> results;

    private String status;

    @JsonProperty("error_message")
    private String errorMessage;

    @JsonProperty("next_page_token")
    private String nextPageToken;

    public List<GooglePlaceResponse> getResults() {
        return results;
    }

    public void setResults(List<GooglePlaceResponse> results) {
        this.results = results;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getNextPageToken() {
        return nextPageToken;
    }

    public void setNextPageToken(String nextPageToken) {
        this.nextPageToken = nextPageToken;
    }

    public boolean isSuccess() {
        return "OK".equals(status) || "ZERO_RESULTS".equals(status);
    }
}
