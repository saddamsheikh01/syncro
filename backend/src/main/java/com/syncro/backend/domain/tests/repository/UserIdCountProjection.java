package com.syncro.backend.domain.tests.repository;

import java.util.UUID;

public interface UserIdCountProjection {

    UUID getUserId();

    long getCount();
}

