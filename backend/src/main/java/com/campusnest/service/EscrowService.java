package com.campusnest.service;

import com.campusnest.dto.EscrowResponseDto;
import com.campusnest.dto.PropertyResponseDto;
import com.campusnest.dto.ReservationRequestDto;
import com.campusnest.entity.EscrowStatus;
import com.campusnest.entity.EscrowToken;
import com.campusnest.entity.Property;
import com.campusnest.repository.EscrowTokenRepository;
import com.campusnest.repository.PropertyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;

@Service
public class EscrowService {

    public static final int TOKEN_AMOUNT_INR = 1000;
    public static final Duration HOLD_PERIOD = Duration.ofHours(48);

    private final PropertyRepository properties;
    private final EscrowTokenRepository tokens;

    public EscrowService(PropertyRepository properties, EscrowTokenRepository tokens) {
        this.properties = properties;
        this.tokens = tokens;
    }

    /** Reserves one bed for 48 hours. The property row is locked so the last bed cannot be double-booked. */
    @Transactional
    public EscrowResponseDto reserve(ReservationRequestDto req) {
        Property property = properties.findByIdForUpdate(req.propertyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        // Normalise so "9876543210" and "+91 98765 43210" count as the same student.
        String phone = req.studentPhone().replaceAll("[\\s-]", "").replaceFirst("^\\+91", "");
        if (property.getAvailableBeds() < 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No beds are available in this listing right now.");
        }
        if (tokens.existsByPropertyIdAndStudentPhoneAndStatus(property.getId(), phone, EscrowStatus.HELD)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This phone number already holds a reservation for this listing.");
        }

        property.setAvailableBeds(property.getAvailableBeds() - 1);

        Instant now = Instant.now();
        EscrowToken token = new EscrowToken();
        token.setProperty(property);
        token.setStudentName(req.studentName().replaceAll("\\s+", " ").trim());
        token.setStudentPhone(phone);
        token.setAmountInr(TOKEN_AMOUNT_INR);
        token.setStatus(EscrowStatus.HELD);
        token.setCreatedAt(now);
        token.setExpiresAt(now.plus(HOLD_PERIOD));
        EscrowToken saved = tokens.save(token);

        return new EscrowResponseDto(
                saved.getId(),
                saved.getAmountInr(),
                saved.getStatus(),
                saved.getExpiresAt().toEpochMilli(),
                PropertyResponseDto.from(property));
    }

    /** Frees beds whose 48-hour hold has run out. Called by {@link com.campusnest.config.EscrowExpiryJob}. */
    @Transactional
    public int releaseExpired() {
        var expired = tokens.findByStatusAndExpiresAtBefore(EscrowStatus.HELD, Instant.now());
        for (EscrowToken token : expired) {
            properties.findByIdForUpdate(token.getProperty().getId())
                    .ifPresent(p -> p.setAvailableBeds(p.getAvailableBeds() + 1));
            token.setStatus(EscrowStatus.EXPIRED);
        }
        return expired.size();
    }
}
