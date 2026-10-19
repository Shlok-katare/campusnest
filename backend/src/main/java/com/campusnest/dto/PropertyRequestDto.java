package com.campusnest.dto;

import com.campusnest.entity.ListingOrigin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PropertyRequestDto(
        @NotBlank @Size(min = 5, max = 120, message = "Title must be 5 to 120 characters")
        String title,

        @NotBlank @Pattern(regexp = "PG / Hostel|Flat Sharing", message = "Type must be 'PG / Hostel' or 'Flat Sharing'")
        String type,

        @NotNull(message = "Source is required")
        ListingOrigin source,

        @Size(max = 100)
        String submitterRole,

        @NotBlank(message = "Name is required") @Size(max = 80)
        String submitterName,

        @NotBlank @Size(max = 100)
        String hub,

        @NotNull(message = "Distance is required") @DecimalMin("0.0") @DecimalMax("500.0")
        Double distanceKm,

        @NotNull(message = "Rent is required") @Min(value = 1, message = "Rent must be greater than 0") @Max(500000)
        Integer rent,

        @NotNull(message = "Deposit is required") @Min(0) @Max(5000000)
        Integer deposit,

        @NotBlank @Size(max = 40)
        String sharing,

        @NotBlank @Pattern(regexp = "Boys|Girls|Any", message = "Gender must be Boys, Girls or Any")
        String gender,

        @NotNull @Min(value = 1, message = "At least 1 bed must be open") @Max(50)
        Integer availableBeds,

        @Size(max = 20)
        List<@NotBlank @Size(max = 60) String> amenities,

        @Size(max = 15)
        List<@NotBlank @Size(max = 200) String> rules,

        @Size(max = 5)
        List<@Pattern(regexp = "^https?://\\S{1,990}$", message = "Image link must start with http:// or https://") String> images,

        @NotBlank @Pattern(regexp = Patterns.PHONE, message = "Enter a valid Indian mobile number")
        String phone,

        @Size(max = 80)
        String landlordName
) {
}
