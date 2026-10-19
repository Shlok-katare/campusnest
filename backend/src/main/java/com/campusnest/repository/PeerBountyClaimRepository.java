package com.campusnest.repository;

import com.campusnest.entity.PeerBountyClaim;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PeerBountyClaimRepository extends JpaRepository<PeerBountyClaim, Long> {

    Optional<PeerBountyClaim> findByPropertyId(Long propertyId);
}
