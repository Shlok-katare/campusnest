package com.campusnest.config;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Minimal protection for admin-only actions (verifying listings). A single shared secret sent in the
 * X-Admin-Key header. Replace with real login and roles (see UserRole) when accounts are added.
 */
@Component
public class AdminKeyGuard {

    private final byte[] expected;

    public AdminKeyGuard(AppProperties props) {
        String key = props.adminKey() == null ? "" : props.adminKey().trim();
        this.expected = key.getBytes(StandardCharsets.UTF_8);
    }

    public void require(String provided) {
        if (expected.length == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Verification is disabled: set the ADMIN_KEY environment variable on the server.");
        }
        byte[] given = (provided == null ? "" : provided.trim()).getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, given)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid admin key.");
        }
    }
}
