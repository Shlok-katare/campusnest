package com.campusnest.dto;

import com.campusnest.entity.EscrowStatus;

public record EscrowResponseDto(
        Long tokenId,
        int amountInr,
        EscrowStatus status,
        long expiresAt,
        PropertyResponseDto property
) {
}
