package com.syncro.backend.domain.external.viator.dto;

public record ViatorFetchResult(
    ViatorProductsPage page,
    boolean endpointAccessDenied,
    String errorMessage
) {
    public static ViatorFetchResult success(ViatorProductsPage page) {
        return new ViatorFetchResult(page, false, null);
    }

    public static ViatorFetchResult accessDenied(String errorMessage) {
        return new ViatorFetchResult(null, true, errorMessage);
    }

    public static ViatorFetchResult failure(String errorMessage) {
        return new ViatorFetchResult(null, false, errorMessage);
    }

    public boolean isSuccess() {
        return page != null;
    }
}
