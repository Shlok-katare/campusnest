package com.campusnest.repository;

import com.campusnest.entity.Property;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property, Long> {

    /** Row-locks the property so two students cannot grab the last bed at the same moment. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Property p where p.id = :id")
    Optional<Property> findByIdForUpdate(@Param("id") Long id);
}
