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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A refundable reservation token. NOTE: no real money moves yet. This records the reservation
 * and holds a bed; a payment gateway (e.g. Razorpay) still has to be integrated.
 */
@Entity
@Table(name = "escrow_tokens")
@Getter
@Setter
@NoArgsConstructor
public class EscrowToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(nullable = false, length = 80)
    private String studentName;

    @Column(nullable = false, length = 20)
    private String studentPhone;

    @Column(nullable = false)
    private int amountInr;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EscrowStatus status = EscrowStatus.HELD;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant expiresAt;
}
