package com.campusnest.controller;

import com.campusnest.config.AdminKeyGuard;
import com.campusnest.dto.PropertyRequestDto;
import com.campusnest.dto.PropertyResponseDto;
import com.campusnest.dto.PropertySearchCriteria;
import com.campusnest.service.PropertyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    private final PropertyService service;
    private final AdminKeyGuard adminGuard;

    public PropertyController(PropertyService service, AdminKeyGuard adminGuard) {
        this.service = service;
        this.adminGuard = adminGuard;
    }

    /** All listings, newest first. Every filter is optional. */
    @GetMapping
    public List<PropertyResponseDto> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String hub,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Integer maxRent,
            @RequestParam(defaultValue = "false") boolean verifiedOnly,
            @RequestParam(required = false) List<String> amenities,
            @RequestParam(required = false) String sort) {
        return service.search(new PropertySearchCriteria(q, hub, type, gender, source, maxRent,
                verifiedOnly, amenities, sort));
    }

    @GetMapping("/{id}")
    public PropertyResponseDto get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PropertyResponseDto create(@Valid @RequestBody PropertyRequestDto request) {
        return service.create(request);
    }

    /** Admin only: confirms a listing and releases the scout bounty. */
    @PostMapping("/{id}/verify")
    public PropertyResponseDto verify(@PathVariable Long id,
                                      @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        adminGuard.require(adminKey);
        return service.verify(id);
    }
}
