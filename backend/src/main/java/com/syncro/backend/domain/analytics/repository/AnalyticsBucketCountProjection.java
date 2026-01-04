package com.syncro.backend.domain.analytics.repository;

import java.time.Instant;

public interface AnalyticsBucketCountProjection {

    Instant getBucket();

    long getTotal();
}
