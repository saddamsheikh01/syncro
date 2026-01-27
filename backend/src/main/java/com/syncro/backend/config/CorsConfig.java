package com.syncro.backend.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Bean(name = "syncroCorsConfigurationSource")
    @Profile("!dev")
    public CorsConfigurationSource corsConfigurationSource() {
        return buildCorsConfigurationSource(List.of(
            "https://syncroapp.it",
            "https://www.syncroapp.it"
        ));
    }

    @Bean(name = "syncroCorsConfigurationSource")
    @Profile("dev")
    public CorsConfigurationSource corsConfigurationSourceDev() {
        return buildCorsConfigurationSource(List.of(
            "https://syncroapp.it",
            "https://www.syncroapp.it",
            "http://localhost:3000"
        ));
    }

    private CorsConfigurationSource buildCorsConfigurationSource(List<String> allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
