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
		app.addInitializers(new RailwayEnvironmentInitializer(), new DevSchemaConfig());
		app.run(args);
	}

}
