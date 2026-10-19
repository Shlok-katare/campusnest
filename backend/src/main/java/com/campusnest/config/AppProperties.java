package com.campusnest.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/** Binds the "app.*" block in application.yml. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Cors cors, String adminKey, boolean seedDemoData) {

    public record Cors(List<String> allowedOrigins) {
    }
}
