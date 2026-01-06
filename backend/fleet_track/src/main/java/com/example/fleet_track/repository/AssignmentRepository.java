package com.example.fleet_track.repository;

import com.example.fleet_track.models.Assignment;
import com.example.fleet_track.models.Assignment.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {


    // By status
    List<Assignment> findByStatus(AssignmentStatus status);

    // By vehicle
    List<Assignment> findByVehicle_Id(Long vehicleId);

    // By driver
    List<Assignment> findByDriver_Id(Long driverId);


}
