package com.campusnest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ReservationRequestDto(
        @NotNull(message = "Property is required")
        Long propertyId,

        @NotBlank(message = "Your name is required") @Size(min = 2, max = 80)
        String studentName,

        @NotBlank @Pattern(regexp = Patterns.PHONE, message = "Enter a valid Indian mobile number")
        String studentPhone
) {
}
