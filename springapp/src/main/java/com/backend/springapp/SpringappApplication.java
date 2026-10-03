package com.backend.springapp;

import com.backend.springapp.common.AppRuntimeHints;
import com.backend.springapp.common.SockJsRuntimeHints;
import org.springframework.context.annotation.ImportRuntimeHints;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ImportRuntimeHints({SockJsRuntimeHints.class, AppRuntimeHints.class})
public class SpringappApplication {

	public static void main(String[] args) {
		// One clock: LocalDateTime.now() must match the UTC database session (see vantage-time.properties).
		// Runs at start-up, not in a static block, so a native image reads it at run time.
		java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("UTC"));
		SpringApplication.run(SpringappApplication.class, args);
	}

}
