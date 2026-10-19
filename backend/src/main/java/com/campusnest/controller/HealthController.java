package com.campusnest.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    /** Used by Render's health check and for quick "is the API awake?" tests. */
    @GetMapping
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
