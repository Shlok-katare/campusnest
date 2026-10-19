package com.campusnest.dto;

import com.campusnest.entity.BountyStatus;
import com.campusnest.entity.ListingOrigin;
import com.campusnest.entity.Property;
import com.campusnest.entity.VerificationStatus;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/** JSON shape consumed by the React app. Field names match what the UI already uses. */
public record PropertyResponseDto(
        Long id,
        long createdAt,
        String title,
        String type,
        ListingOrigin source,
        String submitterRole,
        String submitterName,
        VerificationStatus status,
        String hub,
        String distance,
        double distanceKm,
        int rent,
        int deposit,
        String sharing,
        String gender,
        int availableBeds,
        List<String> images,
        List<String> amenities,
        List<String> rules,
        String phone,
        String landlordName,
        BountyStatus bountyStatus,
        String verifiedAt
) {

    private static final DateTimeFormatter DATE =
            DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH).withZone(ZoneId.of("Asia/Kolkata"));

    public static PropertyResponseDto from(Property p) {
        return new PropertyResponseDto(
                p.getId(),
                p.getCreatedAt().toEpochMilli(),
                p.getTitle(),
                p.getType(),
                p.getSource(),
                p.getSubmitterRole(),
                p.getSubmitterName(),
                p.getStatus(),
                p.getHub(),
                distanceLabel(p),
                p.getDistanceKm(),
                p.getRent(),
                p.getDeposit(),
                p.getSharing(),
                p.getGender(),
                p.getAvailableBeds(),
                List.copyOf(p.getImages()),
                List.copyOf(p.getAmenities()),
                List.copyOf(p.getRules()),
                p.getPhone(),
                p.getLandlordName(),
                p.getBountyStatus(),
                p.getVerifiedAt() == null ? null : DATE.format(p.getVerifiedAt())
        );
    }

    private static String distanceLabel(Property p) {
        if (p.getDistanceLabel() != null && !p.getDistanceLabel().isBlank()) {
            return p.getDistanceLabel();
        }
        double km = p.getDistanceKm();
        String value = km == Math.rint(km) ? String.valueOf((long) km) : String.valueOf(km);
        return value + " km from Campus";
    }
}
