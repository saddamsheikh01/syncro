package com.syncro.backend;

import com.syncro.backend.support.TestContainersConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestContainersConfig.class)
class BackendApplicationIntegrationTest {

    @Test
    void contextLoads() {
    }
}
