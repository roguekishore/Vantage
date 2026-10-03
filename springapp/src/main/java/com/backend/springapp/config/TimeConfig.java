package com.backend.springapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

/**
 * Loads the committed time settings (UTC DB session, skew guard). application.properties is gitignored, so these must
 * live in the repo; @PropertySource ranks below application.properties and env vars.
 */
@Configuration
@PropertySource("classpath:vantage-time.properties")
public class TimeConfig {
}
