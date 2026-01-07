package com.example.fleet_track.service;

import com.example.fleet_track.models.User;
import com.example.fleet_track.models.Vehicle;
import com.example.fleet_track.repository.UserRepository;
import com.example.fleet_track.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrackService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllVehiclesWithDetails() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        return vehicles.stream()
                .map(this::mapVehicleToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> searchVehiclesAndDrivers(String query) {
        String searchTerm = query.toLowerCase().trim();

        List<Vehicle> vehicles = vehicleRepository.findAll().stream()
                .filter(v -> v.getRegistrationNumber().toLowerCase().contains(searchTerm) ||
                        v.getVehicleName().toLowerCase().contains(searchTerm) ||
                        (v.getModel() != null && v.getModel().toLowerCase().contains(searchTerm)) ||
                        v.getId().toString().equals(searchTerm))
                .collect(Collectors.toList());

        List<User> drivers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.UserRole.DRIVER &&
                        (u.getName().toLowerCase().contains(searchTerm) ||
                                u.getUsername().toLowerCase().contains(searchTerm) ||
                                u.getId().toString().equals(searchTerm)))
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("vehicles", vehicles.stream()
                .map(this::mapVehicleToResponse)
                .collect(Collectors.toList()));
        result.put("drivers", drivers.stream()
                .map(this::mapDriverToResponse)
                .collect(Collectors.toList()));

        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getVehicleDetailsById(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));
        return mapVehicleToResponse(vehicle);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getVehicleDetailsByDriverId(Long driverId) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));

        if (driver.getAssignedVehicles() != null && !driver.getAssignedVehicles().isEmpty()) {
            Vehicle vehicle = driver.getAssignedVehicles().iterator().next();
            Map<String, Object> response = mapVehicleToResponse(vehicle);
            response.put("driver", mapDriverToResponse(driver));
            return response;
        }

        throw new RuntimeException("No vehicle assigned to driver: " + driverId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTrackedVehicles() {
        return vehicleRepository.findAll().stream()
                .filter(v -> v.getVehicleLocationStatus() == Vehicle.VehicleLocationStatusType.TRACKED)
                .map(this::mapVehicleToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUntrackedVehicles() {
        return vehicleRepository.findAll().stream()
                .filter(v -> v.getVehicleLocationStatus() == Vehicle.VehicleLocationStatusType.UNTRACKED)
                .map(this::mapVehicleToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> updateVehicleLocation(Long vehicleId, Double latitude, Double longitude) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));

        vehicle.setVehicleLatitude(latitude);
        vehicle.setVehicleLongitude(longitude);
        vehicle.setVehicleLocationStatus(Vehicle.VehicleLocationStatusType.TRACKED);

        vehicleRepository.save(vehicle);
        return mapVehicleToResponse(vehicle);
    }

    private Map<String, Object> mapVehicleToResponse(Vehicle vehicle) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", vehicle.getId());
        response.put("vehicleName", vehicle.getVehicleName());
        response.put("registrationNumber", vehicle.getRegistrationNumber());
        response.put("model", vehicle.getModel());
        response.put("type", vehicle.getType().toString());
        response.put("status", vehicle.getStatus().toString());
        response.put("vehicleLocationStatus", vehicle.getVehicleLocationStatus().toString());
        response.put("capacity", vehicle.getCapacity());
        response.put("fuelLevel", vehicle.getFuelLevel());
        response.put("mileage", vehicle.getMileage());
        response.put("currentLocation", vehicle.getCurrentLocation());

        Map<String, Double> location = new HashMap<>();
        location.put("lat", vehicle.getVehicleLatitude() != null ? vehicle.getVehicleLatitude() : 0.0);
        location.put("lng", vehicle.getVehicleLongitude() != null ? vehicle.getVehicleLongitude() : 0.0);
        response.put("location", location);

        if (vehicle.getAssignedDrivers() != null && !vehicle.getAssignedDrivers().isEmpty()) {
            User driver = vehicle.getAssignedDrivers().iterator().next();
            Map<String, Object> driverInfo = new HashMap<>();
            driverInfo.put("id", driver.getId());
            driverInfo.put("name", driver.getName());
            driverInfo.put("username", driver.getUsername());
            driverInfo.put("phoneNumber", driver.getPhoneNumber());
            driverInfo.put("status", driver.getStatus().toString());
            response.put("assignedDriver", driverInfo);
        } else {
            response.put("assignedDriver", null);
        }

        return response;
    }

    private Map<String, Object> mapDriverToResponse(User driver) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", driver.getId());
        response.put("name", driver.getName());
        response.put("username", driver.getUsername());
        response.put("phoneNumber", driver.getPhoneNumber());
        response.put("mailId", driver.getMailId());
        response.put("status", driver.getStatus().toString());
        response.put("totalTrips", driver.getTotalTrips());
        response.put("rating", driver.getRatings());

        if (driver.getAssignedVehicles() != null && !driver.getAssignedVehicles().isEmpty()) {
            Vehicle vehicle = driver.getAssignedVehicles().iterator().next();
            response.put("assignedVehicleId", vehicle.getId());
            response.put("assignedVehicleRegistration", vehicle.getRegistrationNumber());
        } else {
            response.put("assignedVehicleId", null);
            response.put("assignedVehicleRegistration", null);
        }

        return response;
    }
}