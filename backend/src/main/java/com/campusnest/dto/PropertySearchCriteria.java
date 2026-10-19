package com.campusnest.dto;

import java.util.List;

/** Optional filters for GET /api/properties. Any null/blank field is ignored. */
public record PropertySearchCriteria(
        String q,
        String hub,
        String type,
        String gender,
        String source,
        Integer maxRent,
        boolean verifiedOnly,
        List<String> amenities,
        String sort
) {
}
