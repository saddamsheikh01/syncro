package com.syncro.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearer-jwt";

    @Value("${app.api.base-url:http://localhost:8080}")
    private String apiBaseUrl;

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Syncro API")
                .description("Syncro backend API")
                .version("v1"))
            .components(new Components()
                .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")))
            .addServersItem(new Server().url(apiBaseUrl));
    }

    @Bean
    public GroupedOpenApi authApi() {
        return GroupedOpenApi.builder()
            .group("auth")
            .pathsToMatch("/api/v1/auth/**")
            .pathsToExclude("/api/v1/auth/admin/**")
            .build();
    }

    @Bean
    public GroupedOpenApi adminAuthApi() {
        return GroupedOpenApi.builder()
            .group("admin-auth")
            .pathsToMatch("/api/v1/auth/admin/**")
            .build();
    }

    @Bean
    public GroupedOpenApi usersApi() {
        return GroupedOpenApi.builder()
            .group("users")
            .pathsToMatch("/api/v1/users/**")
            .build();
    }

    @Bean
    public GroupedOpenApi profileApi() {
        return GroupedOpenApi.builder()
            .group("profile")
            .pathsToMatch("/api/v1/profile/**")
            .build();
    }

    @Bean
    public GroupedOpenApi preferencesApi() {
        return GroupedOpenApi.builder()
            .group("preferences")
            .pathsToMatch("/api/v1/preferences/**")
            .build();
    }

    @Bean
    public GroupedOpenApi positionsApi() {
        return GroupedOpenApi.builder()
            .group("positions")
            .pathsToMatch("/api/v1/positions/**")
            .build();
    }

    @Bean
    public GroupedOpenApi tagsApi() {
        return GroupedOpenApi.builder()
            .group("tags")
            .pathsToMatch("/api/v1/tags/**")
            .build();
    }

    @Bean
    public GroupedOpenApi interestsApi() {
        return GroupedOpenApi.builder()
            .group("interests")
            .pathsToMatch("/api/v1/users/me/interests/**")
            .build();
    }

    @Bean
    public GroupedOpenApi testsApi() {
        return GroupedOpenApi.builder()
            .group("tests")
            .pathsToMatch("/api/v1/tests/**")
            .build();
    }

    @Bean
    public GroupedOpenApi adminTestsApi() {
        return GroupedOpenApi.builder()
            .group("admin-tests")
            .pathsToMatch("/api/v1/admin/tests/**")
            .build();
    }

    @Bean
    public GroupedOpenApi categoriesApi() {
        return GroupedOpenApi.builder()
            .group("categories")
            .pathsToMatch("/api/v1/categories/**")
            .build();
    }

    @Bean
    public GroupedOpenApi placesApi() {
        return GroupedOpenApi.builder()
            .group("places")
            .pathsToMatch("/api/v1/places/**")
            .build();
    }

    @Bean
    public GroupedOpenApi experiencesApi() {
        return GroupedOpenApi.builder()
            .group("experiences")
            .pathsToMatch("/api/v1/experiences/**")
            .build();
    }

    @Bean
    public GroupedOpenApi adminCategoriesApi() {
        return GroupedOpenApi.builder()
            .group("admin-categories")
            .pathsToMatch("/api/v1/admin/categories/**")
            .build();
    }

    @Bean
    public GroupedOpenApi adminPlacesApi() {
        return GroupedOpenApi.builder()
            .group("admin-places")
            .pathsToMatch("/api/v1/admin/places/**")
            .build();
    }

    @Bean
    public GroupedOpenApi adminExperiencesApi() {
        return GroupedOpenApi.builder()
            .group("admin-experiences")
            .pathsToMatch("/api/v1/admin/experiences/**")
            .build();
    }

    @Bean
    public GroupedOpenApi favoritesApi() {
        return GroupedOpenApi.builder()
            .group("favorites")
            .pathsToMatch("/api/v1/favorites/**")
            .build();
    }

    @Bean
    public GroupedOpenApi matchesUsersApi() {
        return GroupedOpenApi.builder()
            .group("matches-users")
            .pathsToMatch("/api/v1/matches/users/**")
            .build();
    }

    @Bean
    public GroupedOpenApi matchesPlacesApi() {
        return GroupedOpenApi.builder()
            .group("matches-places")
            .pathsToMatch("/api/v1/matches/places/**")
            .build();
    }
}
