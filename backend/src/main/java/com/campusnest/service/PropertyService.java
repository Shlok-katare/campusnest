package com.campusnest.service;

import com.campusnest.dto.PropertyRequestDto;
import com.campusnest.dto.PropertyResponseDto;
import com.campusnest.dto.PropertySearchCriteria;
import com.campusnest.entity.BountyStatus;
import com.campusnest.entity.ListingOrigin;
import com.campusnest.entity.PeerBountyClaim;
import com.campusnest.entity.Property;
import com.campusnest.entity.VerificationStatus;
import com.campusnest.repository.PeerBountyClaimRepository;
import com.campusnest.repository.PropertyRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class PropertyService {

    static final String DEFAULT_IMAGE =
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";

    private final PropertyRepository properties;
    private final PeerBountyClaimRepository bounties;

    public PropertyService(PropertyRepository properties, PeerBountyClaimRepository bounties) {
        this.properties = properties;
        this.bounties = bounties;
    }

    /**
     * Filters in memory. That is fine for the few hundred listings a campus app has; switch to a
     * database query (JPA Specification) once the table grows into the many thousands.
     */
    @Transactional(readOnly = true)
    public List<PropertyResponseDto> search(PropertySearchCriteria c) {
        String q = c.q() == null ? "" : c.q().trim().toLowerCase(Locale.ROOT);
        List<String> wantedAmenities = c.amenities() == null ? List.of() : c.amenities();

        Stream<Property> stream = properties.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(p -> q.isEmpty() || haystack(p).contains(q))
                .filter(p -> isBlank(c.hub()) || p.getHub().equals(c.hub()))
                .filter(p -> isBlank(c.type()) || p.getType().equals(c.type()))
                .filter(p -> isBlank(c.gender()) || p.getGender().equals(c.gender()) || p.getGender().equals("Any"))
                .filter(p -> isBlank(c.source()) || matchesSource(p, c.source()))
                .filter(p -> c.maxRent() == null || p.getRent() <= c.maxRent())
                .filter(p -> !c.verifiedOnly() || p.getStatus() == VerificationStatus.VERIFIED)
                .filter(p -> wantedAmenities.isEmpty() || p.getAmenities().containsAll(wantedAmenities));

        return stream.sorted(comparator(c.sort()))
                .map(PropertyResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PropertyResponseDto get(Long id) {
        return PropertyResponseDto.from(properties.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found")));
    }

    /** Every new listing starts as PENDING_VERIFICATION. Only an admin can mark it verified. */
    @Transactional
    public PropertyResponseDto create(PropertyRequestDto dto) {
        boolean landlord = dto.source() == ListingOrigin.DIRECT_LANDLORD;

        Property p = new Property();
        p.setTitle(clean(dto.title()));
        p.setType(dto.type());
        p.setSource(dto.source());
        p.setSubmitterRole(landlord ? "Direct Landlord"
                : isBlank(dto.submitterRole()) ? "Peer Scout" : clean(dto.submitterRole()));
        p.setSubmitterName(clean(dto.submitterName()));
        p.setStatus(VerificationStatus.PENDING_VERIFICATION);
        p.setHub(clean(dto.hub()));
        p.setDistanceKm(dto.distanceKm());
        p.setRent(dto.rent());
        p.setDeposit(dto.deposit());
        p.setSharing(clean(dto.sharing()));
        p.setGender(dto.gender());
        p.setAvailableBeds(dto.availableBeds());
        p.setPhone(dto.phone().trim());
        p.setLandlordName(isBlank(dto.landlordName()) ? null : clean(dto.landlordName()));
        p.setAmenities(cleanList(dto.amenities()));
        p.setRules(cleanList(dto.rules()));

        List<String> images = cleanList(dto.images());
        p.setImages(images.isEmpty() ? new ArrayList<>(List.of(DEFAULT_IMAGE)) : images);

        if (!landlord) {
            p.setBountyStatus(BountyStatus.PENDING_CALL);
        }
        Property saved = properties.save(p);

        if (!landlord) {
            PeerBountyClaim claim = new PeerBountyClaim();
            claim.setProperty(saved);
            claim.setScoutName(saved.getSubmitterName());
            bounties.save(claim);
        }
        return PropertyResponseDto.from(saved);
    }

    /** Marks a listing verified and credits the scout bounty if there is one. Safe to call twice. */
    @Transactional
    public PropertyResponseDto verify(Long id) {
        Property p = properties.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (p.getStatus() != VerificationStatus.VERIFIED) {
            p.setStatus(VerificationStatus.VERIFIED);
            p.setVerifiedAt(Instant.now());
        }
        bounties.findByPropertyId(id).ifPresent(claim -> {
            if (claim.getStatus() != BountyStatus.CREDITED) {
                claim.setStatus(BountyStatus.CREDITED);
                claim.setCreditedAt(Instant.now());
                p.setBountyStatus(BountyStatus.CREDITED);
            }
        });
        return PropertyResponseDto.from(p);
    }

    // ---------- helpers ----------

    private static String haystack(Property p) {
        return (p.getTitle() + " " + p.getHub() + " " + p.getType() + " " + p.getSharing() + " "
                + p.getGender() + " " + String.join(" ", p.getAmenities())).toLowerCase(Locale.ROOT);
    }

    private static boolean matchesSource(Property p, String source) {
        return switch (source.toUpperCase(Locale.ROOT)) {
            case "DIRECT", "DIRECT_LANDLORD" -> p.getSource() == ListingOrigin.DIRECT_LANDLORD;
            case "PEER", "PEER_SCOUT" -> p.getSource() == ListingOrigin.PEER_SCOUT;
            default -> true;
        };
    }

    private static Comparator<Property> comparator(String sort) {
        if (sort == null) {
            sort = "newest";
        }
        return switch (sort) {
            case "rent_asc" -> Comparator.comparingInt(Property::getRent);
            case "rent_desc" -> Comparator.comparingInt(Property::getRent).reversed();
            case "distance" -> Comparator.comparingDouble(Property::getDistanceKm);
            default -> Comparator.comparing(Property::getCreatedAt).reversed();
        };
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank() || s.equals("ALL");
    }

    /** Collapses line breaks and extra spaces so values are safe to store and display. */
    private static String clean(String s) {
        return s == null ? "" : s.replaceAll("\\s+", " ").trim();
    }

    private static List<String> cleanList(List<String> in) {
        if (in == null) {
            return new ArrayList<>();
        }
        return in.stream().map(PropertyService::clean).filter(s -> !s.isEmpty())
                .distinct().collect(Collectors.toCollection(ArrayList::new));
    }
}
