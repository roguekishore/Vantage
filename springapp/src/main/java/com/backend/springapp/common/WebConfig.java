package com.backend.springapp.common;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS + HTTP client configuration.
 */
@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Allow all origins for the sync endpoint (used by the browser extension)
                registry.addMapping("/api/sync/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");

                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:5173")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }

    /**
     * Shared RestTemplate for internal service calls (e.g. Spring Boot → Judge).
     * Connect timeout: 5 s — fail fast if judge is unreachable.
     * Read timeout:   30 s — generous enough for slow Java compilations.
     */
    @Bean
    public RestTemplate judgeRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);   // 5 seconds
        factory.setReadTimeout(30_000);     // 30 seconds
        return new RestTemplate(factory);
    }
}
