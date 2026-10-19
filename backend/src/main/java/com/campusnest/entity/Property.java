package com.campusnest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "properties")
@Getter
@Setter
@NoArgsConstructor
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    /** "PG / Hostel" or "Flat Sharing". */
    @Column(nullable = false, length = 40)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ListingOrigin source;

    @Column(length = 100)
    private String submitterRole;

    @Column(nullable = false, length = 80)
    private String submitterName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VerificationStatus status = VerificationStatus.PENDING_VERIFICATION;

    @Column(nullable = false, length = 100)
    private String hub;

    @Column(nullable = false)
    private double distanceKm;

    /** Optional human label such as "800m from Y-Junction Gate". Generated from distanceKm when null. */
    @Column(length = 120)
    private String distanceLabel;

    @Column(nullable = false)
    private int rent;

    @Column(nullable = false)
    private int deposit;

    @Column(nullable = false, length = 40)
    private String sharing;

    /** Boys, Girls or Any. */
    @Column(nullable = false, length = 10)
    private String gender;

    @Column(nullable = false)
    private int availableBeds;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "text")
    private List<String> images = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "text")
    private List<String> amenities = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "text")
    private List<String> rules = new ArrayList<>();

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 80)
    private String landlordName;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private BountyStatus bountyStatus;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant verifiedAt;
}
