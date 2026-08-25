package com.syncro.backend.web;

import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @RequestMapping(
        path = {"/health", "/health/"},
        method = {RequestMethod.GET, RequestMethod.HEAD},
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
