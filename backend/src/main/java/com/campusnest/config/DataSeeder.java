package com.campusnest.config;

import com.campusnest.entity.BountyStatus;
import com.campusnest.entity.ListingOrigin;
import com.campusnest.entity.PeerBountyClaim;
import com.campusnest.entity.Property;
import com.campusnest.entity.VerificationStatus;
import com.campusnest.repository.PeerBountyClaimRepository;
import com.campusnest.repository.PropertyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Inserts the three demo listings the UI shipped with, but only into an empty database. */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final String IMG_BUNK =
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";
    private static final String IMG_BED =
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80";
    private static final String IMG_LIVING =
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80";

    private final AppProperties props;
    private final PropertyRepository properties;
    private final PeerBountyClaimRepository bounties;

    public DataSeeder(AppProperties props, PropertyRepository properties, PeerBountyClaimRepository bounties) {
        this.props = props;
        this.properties = properties;
        this.bounties = bounties;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!props.seedDemoData() || properties.count() > 0) {
            return;
        }
        Instant now = Instant.now();

        Property gokul = base("Gokul Residency Deluxe Boys PG", "PG / Hostel", ListingOrigin.DIRECT_LANDLORD,
                "Direct Landlord", "Ramesh Sharma (Owner)", "IIT Hyderabad (Kandi)", 1.2, "1.2 km from Main Gate",
                7500, 15000, "Double Sharing", "Boys", 3, "+91 98765 43210", now.minus(Duration.ofDays(6)));
        gokul.setImages(new ArrayList<>(List.of(IMG_BUNK, IMG_BED)));
        gokul.setAmenities(new ArrayList<>(List.of("Meals Included", "Wi-Fi", "RO Water", "Power Backup", "Washing Machine")));
        gokul.setRules(new ArrayList<>(List.of("Entry by 10:30 PM", "No smoking/drinking", "Visitors permitted in lobby only")));
        gokul.setStatus(VerificationStatus.VERIFIED);
        gokul.setVerifiedAt(now.minus(Duration.ofDays(6)));

        Property krishna = base("Shree Krishna Girls Luxury Hostel", "PG / Hostel", ListingOrigin.PEER_SCOUT,
                "Senior Student (Outgoing)", "Aditi Rao (Final Year)", "IIT Hyderabad (Kandi)", 0.8, "800m from Y-Junction Gate",
                9000, 18000, "Single", "Girls", 2, "+91 91234 56789", now.minus(Duration.ofDays(4)));
        krishna.setImages(new ArrayList<>(List.of(IMG_BED, IMG_LIVING)));
        krishna.setAmenities(new ArrayList<>(List.of("Meals Included", "24/7 Security", "Attached Washroom", "Wi-Fi")));
        krishna.setRules(new ArrayList<>(List.of("Biometric punch by 9:30 PM", "Quiet hours after 11 PM")));
        krishna.setStatus(VerificationStatus.VERIFIED);
        krishna.setVerifiedAt(now.minus(Duration.ofDays(4)));
        krishna.setBountyStatus(BountyStatus.CREDITED);

        Property flat = base("2BHK Shared Flat - Room Vacancy", "Flat Sharing", ListingOrigin.PEER_SCOUT,
                "Current Flatmate Seeking Replacement", "Karthik Verma (M.Tech)", "IIT Hyderabad (Kandi)", 2.5, "2.5 km from Campus",
                6200, 12000, "Private Room in Flat", "Any", 1, "+91 94400 11223", now.minus(Duration.ofDays(1)));
        flat.setImages(new ArrayList<>(List.of(IMG_LIVING)));
        flat.setAmenities(new ArrayList<>(List.of("Refrigerator", "Wi-Fi", "Bike Parking")));
        flat.setRules(new ArrayList<>(List.of("Split electricity & gas bills equally", "Keep common area clean")));
        flat.setLandlordName("Venkatesh Rao");
        flat.setBountyStatus(BountyStatus.PENDING_CALL);

        properties.saveAll(List.of(gokul, krishna, flat));

        bounties.save(claim(krishna, BountyStatus.CREDITED, now.minus(Duration.ofDays(4))));
        bounties.save(claim(flat, BountyStatus.PENDING_CALL, null));

        log.info("Seeded 3 demo listings (set SEED_DEMO_DATA=false to disable)");
    }

    private static Property base(String title, String type, ListingOrigin source, String role, String submitter,
                                 String hub, double km, String label, int rent, int deposit, String sharing,
                                 String gender, int beds, String phone, Instant createdAt) {
        Property p = new Property();
        p.setTitle(title);
        p.setType(type);
        p.setSource(source);
        p.setSubmitterRole(role);
        p.setSubmitterName(submitter);
        p.setHub(hub);
        p.setDistanceKm(km);
        p.setDistanceLabel(label);
        p.setRent(rent);
        p.setDeposit(deposit);
        p.setSharing(sharing);
        p.setGender(gender);
        p.setAvailableBeds(beds);
        p.setPhone(phone);
        p.setCreatedAt(createdAt);
        return p;
    }

    private static PeerBountyClaim claim(Property property, BountyStatus status, Instant creditedAt) {
        PeerBountyClaim c = new PeerBountyClaim();
        c.setProperty(property);
        c.setScoutName(property.getSubmitterName());
        c.setStatus(status);
        c.setCreditedAt(creditedAt);
        return c;
    }
}
