package com.example.fleet_track.service;

import com.example.fleet_track.models.Assignment;
import com.example.fleet_track.models.User;
import com.example.fleet_track.models.Vehicle;
import com.example.fleet_track.repository.AssignmentRepository;
import com.example.fleet_track.repository.UserRepository;
import com.example.fleet_track.repository.VehicleRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Service
public class AssignmentService {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;


    public List<Assignment> getAllAssignments() {
        //System.out.println("🔥 get all HIT 🔥");
        return assignmentRepository.findAll();
    }


    public Optional<Assignment> getAssignmentById(Long id) {
        return assignmentRepository.findById(id);
    }


    public List<Assignment> getAssignmentsByStatus(Assignment.AssignmentStatus status) {
        return assignmentRepository.findByStatus(status);
    }

    public List<Assignment> getAssignmentsByVehicleId(Long vehicleId) {
        return assignmentRepository.findByVehicle_Id(vehicleId);
    }

    public List<Assignment> getAssignmentsByDriverId(Long driverId) {
        return assignmentRepository.findByDriver_Id(driverId);
    }


    public Assignment createAssignment(Assignment request) {
        //System.out.println("🔥 create HIT 🔥");

        // ✅ Vehicle validation
        Long vehicleId = request.getVehicle() != null ? request.getVehicle().getId() : null;
        if (vehicleId == null) {
            throw new RuntimeException("Vehicle ID is required");
        }

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));


        Long driverId = request.getDriver() != null ? request.getDriver().getId() : null;
        if (driverId == null) {
            throw new RuntimeException("Driver ID is required");
        }

        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));

        if (driver.getRole() != User.UserRole.DRIVER) {
            throw new RuntimeException("User is not a DRIVER");
        }

        Assignment assignment = new Assignment();
        assignment.setAssignmentName(request.getAssignmentName());
        assignment.setVehicle(vehicle);
        assignment.setDriver(driver);
        assignment.setStartLocation(request.getStartLocation());
        assignment.setDropLocation(request.getDropLocation());
        assignment.setStartLatitude(request.getStartLatitude());
        assignment.setStartLongitude(request.getStartLongitude());
        assignment.setEndLatitude(request.getEndLatitude());
        assignment.setEndLongitude(request.getEndLongitude());
        assignment.setStartTime(request.getStartTime());
        assignment.setEndTime(request.getEndTime());
        assignment.setStatus(request.getStatus());

        if (request.getStartLatitude() != 0 && request.getEndLatitude() != 0) {
            double distance = calculateDistance(
                    request.getStartLatitude(),
                    request.getStartLongitude(),
                    request.getEndLatitude(),
                    request.getEndLongitude()
            );
            assignment.setRouteDistance(distance);
        }

        return assignmentRepository.save(assignment);
    }


    @Transactional
    public Assignment updateAssignment(Long id, Assignment updated) {

        Assignment existing = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        existing.setAssignmentName(updated.getAssignmentName());
        existing.setStartLocation(updated.getStartLocation());
        existing.setDropLocation(updated.getDropLocation());
        existing.setStartLatitude(updated.getStartLatitude());
        existing.setStartLongitude(updated.getStartLongitude());
        existing.setEndLatitude(updated.getEndLatitude());
        existing.setEndLongitude(updated.getEndLongitude());
        existing.setStartTime(updated.getStartTime());
        existing.setEndTime(updated.getEndTime());
        existing.setStatus(updated.getStatus());


        if (updated.getVehicle() != null && updated.getVehicle().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(updated.getVehicle().getId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            existing.setVehicle(vehicle);
        }


        if (updated.getDriver() != null && updated.getDriver().getId() != null) {
            User driver = userRepository.findById(updated.getDriver().getId())
                    .orElseThrow(() -> new RuntimeException("Driver not found"));
            existing.setDriver(driver);
        }


        double distance = calculateDistance(
                existing.getStartLatitude(),
                existing.getStartLongitude(),
                existing.getEndLatitude(),
                existing.getEndLongitude()
        );
        existing.setRouteDistance(distance);

        return assignmentRepository.save(existing);
    }


    public void deleteAssignment(Long id) {
        if (!assignmentRepository.existsById(id)) {
            throw new RuntimeException("Assignment not found with id: " + id);
        }
        assignmentRepository.deleteById(id);
    }


    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS = 6371; // km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS * c;
    }
}
