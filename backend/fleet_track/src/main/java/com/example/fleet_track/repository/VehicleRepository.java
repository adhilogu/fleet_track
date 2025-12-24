package com.example.fleet_track.repository;
import com.example.fleet_track.models.Vehicle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    boolean existsByRegistrationNumber(String registrationNumber);
    // Optional: find by status, type, etc.
}
