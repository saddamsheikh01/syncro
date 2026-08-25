package com.syncro.backend;

import com.syncro.backend.config.DevSchemaConfig;
import com.syncro.backend.config.RailwayEnvironmentInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(BackendApplication.class);
		if (isRailwayRuntime()) {
			app.setAdditionalProfiles("prod", "railway");
		}
		app.addInitializers(new RailwayEnvironmentInitializer(), new DevSchemaConfig());
		app.run(args);
	}

	private static boolean isRailwayRuntime() {
		return hasEnv("RAILWAY_ENVIRONMENT")
			|| hasEnv("RAILWAY_PROJECT_ID")
			|| hasEnv("RAILWAY_SERVICE_ID");
	}

	private static boolean hasEnv(String name) {
		String value = System.getenv(name);
		return value != null && !value.isBlank();
	}

}
