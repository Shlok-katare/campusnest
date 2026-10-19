package com.campusnest.repository;

import com.campusnest.entity.EscrowStatus;
import com.campusnest.entity.EscrowToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface EscrowTokenRepository extends JpaRepository<EscrowToken, Long> {

    boolean existsByPropertyIdAndStudentPhoneAndStatus(Long propertyId, String studentPhone, EscrowStatus status);

    List<EscrowToken> findByStatusAndExpiresAtBefore(EscrowStatus status, Instant cutoff);
}
