package com.example.fleet_track.repository;
import com.example.fleet_track.models.Assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    // Example custom queries you might need later
    //List<Assignment> findByVehicleId(Long vehicleId);
}
