package com.backend.springapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

/**
 * Loads the committed scale defaults (queue, Redis, matchmaking, experiments). application.properties is gitignored,
 * so these defaults must live in the repo; @PropertySource ranks below application.properties and env vars.
 */
@Configuration
@PropertySource("classpath:vantage-scale.properties")
public class ScaleConfig {
}
