package com.syncro.backend.domain.external.googlemaps.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GooglePlaceDetailsResponse {

    private GooglePlaceResponse result;

    private String status;

    @JsonProperty("error_message")
    private String errorMessage;

    public GooglePlaceResponse getResult() {
        return result;
    }

    public void setResult(GooglePlaceResponse result) {
        this.result = result;
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

    public boolean isSuccess() {
        return "OK".equals(status);
    }
}
