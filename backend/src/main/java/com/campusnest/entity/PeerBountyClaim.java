package com.campusnest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Ledger row for the Rs 500 scout bounty owed for a peer-submitted listing. */
@Entity
@Table(name = "peer_bounty_claims")
@Getter
@Setter
@NoArgsConstructor
public class PeerBountyClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false, unique = true)
    private Property property;

    @Column(nullable = false, length = 80)
    private String scoutName;

    @Column(nullable = false)
    private int amountInr = 500;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BountyStatus status = BountyStatus.PENDING_CALL;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant creditedAt;
}
