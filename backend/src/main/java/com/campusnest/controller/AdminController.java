package com.campusnest.controller;

import com.campusnest.config.AdminKeyGuard;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminKeyGuard guard;

    public AdminController(AdminKeyGuard guard) {
        this.guard = guard;
    }

    /** Lets the Verification Hub check an entered key before unlocking its buttons. */
    @GetMapping("/check")
    public ResponseEntity<Void> check(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        guard.require(adminKey);
        return ResponseEntity.noContent().build();
    }
}
