package com.backend.springapp.common;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Phase 2 — Registers the JWT filter on all /api/** paths.
 *
 * <p>This does NOT use Spring Security's filter chain (no starter-security dep).
 * It simply registers our {@link JwtAuthFilter} as a servlet filter so it can
 * set the {@code jwtUserId} request attribute when a valid JWT is present.</p>
 *
 * <p><b>Phase 3</b> will upgrade this to a full {@code SecurityFilterChain}
 * with endpoint-level authorization.</p>
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilterRegistration() {
        FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(jwtAuthFilter);
        registration.addUrlPatterns("/api/*");
        registration.setOrder(1); // run early
        return registration;
    }
}
