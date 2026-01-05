package com.example.fleet_track.service;

import com.example.fleet_track.models.User;
import com.example.fleet_track.models.Vehicle;
import com.example.fleet_track.repository.UserRepository;
import com.example.fleet_track.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Create a new user (Admin functionality)
     */
    public Map<String, Object> createUser(
            String username,
            String password,
            String name,
            String mailId,
            String phoneNumber,
            String roleStr,
            MultipartFile photo) {   // ← added parameter (can be null)

        Map<String, Object> response = new HashMap<>();

        // Existing validations...
        if (username == null || username.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Username is required");
            return response;
        }

        if (password == null || password.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Password is required");
            return response;
        }

        if (userRepository.existsByUsername(username)) {
            response.put("success", false);
            response.put("message", "Username already exists");
            return response;
        }

        // Role parsing (unchanged)
        User.UserRole role;
        try {
            role = roleStr != null ? User.UserRole.valueOf(roleStr.toUpperCase()) : User.UserRole.DRIVER;
        } catch (IllegalArgumentException e) {
            role = User.UserRole.DRIVER;
        }

        User user = User.builder()
                .username(username.trim())
                .password(passwordEncoder.encode(password))
                .name(name != null && !name.trim().isEmpty() ? name.trim() : "Default User")
                .mailId(mailId != null && !mailId.trim().isEmpty() ? mailId.trim() : "-")
                .phoneNumber(phoneNumber != null && !phoneNumber.trim().isEmpty() ? phoneNumber.trim() : "-")
                .role(role)
                .status(User.UserStatus.ACTIVE)
                .totalTrips(0)
                .ratings(0.0f)
                .build();

        // Handle optional profile photo upload
        if (photo != null && !photo.isEmpty()) {
            try {
                Path uploadDir = Paths.get("uploads/profiles");
                Files.createDirectories(uploadDir);

                String filename = "user_" + System.currentTimeMillis() + "_" +
                        photo.getOriginalFilename().replaceAll("[^a-zA-Z0-9.]", "_");

                Path filePath = uploadDir.resolve(filename);
                Files.copy(photo.getInputStream(), filePath);

                String photoPath = "/uploads/profiles/" + filename;
                user.setProfilePhoto(photoPath);
            } catch (IOException e) {
                response.put("success", false);
                response.put("message", "Failed to save profile photo: " + e.getMessage());
                return response;
            }
        }
        // If no photo was sent → profilePhoto remains null (that's correct!)

        User savedUser = userRepository.save(user);

        response.put("success", true);
        response.put("message", "User created successfully");
        response.put("userId", savedUser.getId());
        response.put("username", savedUser.getUsername());
        response.put("name", savedUser.getName());
        response.put("role", savedUser.getRole().name());
        if (savedUser.getProfilePhoto() != null) {
            response.put("profilePhoto", savedUser.getProfilePhoto());
        }

        return response;
    }

    /**
     * Get all users (non-drivers for Users tab)
     */
    public Map<String, Object> getAllUsers() {
        Map<String, Object> response = new HashMap<>();

        List<User> users = userRepository.findAll();

        List<Map<String, Object>> userList = users.stream()
                .filter(user -> user.getRole() != User.UserRole.DRIVER) // Exclude drivers
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());

        response.put("success", true);
        response.put("users", userList);
        response.put("count", userList.size());

        return response;
    }

    /**
     * Get all drivers
     */
    public Map<String, Object> getAllDrivers() {
        Map<String, Object> response = new HashMap<>();

        List<User> drivers = userRepository.findAll().stream()
                .filter(user -> user.getRole() == User.UserRole.DRIVER)
                .collect(Collectors.toList());

        List<Map<String, Object>> driverList = drivers.stream()
                .map(this::mapDriverToResponse)
                .collect(Collectors.toList());

        response.put("success", true);
        response.put("drivers", driverList);
        response.put("count", driverList.size());

        return response;
    }

    /**
     * Get all vehicles
     */
    public Map<String, Object> getAllVehicles() {
        Map<String, Object> response = new HashMap<>();

        List<Vehicle> vehicles = vehicleRepository.findAll();

        List<Map<String, Object>> vehicleList = vehicles.stream()
                .map(this::mapVehicleToResponse)
                .collect(Collectors.toList());

        response.put("success", true);
        response.put("vehicles", vehicleList);
        response.put("count", vehicleList.size());

        return response;
    }


    private Map<String, Object> mapUserToResponse(User user) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", "USR" + String.format("%03d", user.getId()));
        userMap.put("name", user.getName());
        userMap.put("email", user.getMailId());
        userMap.put("phone", user.getPhoneNumber());
        userMap.put("username", user.getUsername());
        userMap.put("role", user.getRole().name().toLowerCase());
        userMap.put("createdDate", new Date().toString());

        // ADD THIS LINE
        userMap.put("photo", user.getProfilePhoto()); // null if no photo

        return userMap;
    }

    /**
     * Map User to Driver response (for Drivers tab)
     */
    private Map<String, Object> mapDriverToResponse(User driver) {
        Map<String, Object> driverMap = new HashMap<>();
        driverMap.put("id", "DRV" + String.format("%03d", driver.getId()));
        driverMap.put("name", driver.getName());
        driverMap.put("email", driver.getMailId());
        driverMap.put("phone", driver.getPhoneNumber());
        driverMap.put("licenseNumber", "DL-" + driver.getId());
        driverMap.put("status", driver.getStatus().name().toLowerCase().replace("_", "-"));
        driverMap.put("totalTrips", driver.getTotalTrips());
        driverMap.put("rating", driver.getRatings());
        driverMap.put("joinedDate", new Date().toString());
        driverMap.put("photo", driver.getProfilePhoto()); // null if no photo

        if (driver.getAssignedVehicles() != null && !driver.getAssignedVehicles().isEmpty()) {
            Vehicle vehicle = driver.getAssignedVehicles().iterator().next();
            driverMap.put("assignedVehicle", "VEH" + String.format("%03d", vehicle.getId()));
        }

        return driverMap;
    }

    /**
     * Map Vehicle to response
     */

    private Map<String, Object> mapVehicleToResponse(Vehicle vehicle) {
        Map<String, Object> vehicleMap = new HashMap<>();
        vehicleMap.put("id", "VEH" + String.format("%03d", vehicle.getId()));
        vehicleMap.put("name", vehicle.getVehicleName());
        vehicleMap.put("plateNumber", vehicle.getRegistrationNumber());
        vehicleMap.put("model", vehicle.getModel() != null ? vehicle.getModel() : "Unknown Model");
        vehicleMap.put("type", vehicle.getType().name().toLowerCase());
        vehicleMap.put("capacity", vehicle.getCapacity());
        vehicleMap.put("status", vehicle.getStatus().name().toLowerCase().replace("_", "-"));
        vehicleMap.put("lastServiceDate", vehicle.getLastServiceDate() != null ? vehicle.getLastServiceDate().toString() : "-");
        vehicleMap.put("nextServiceDate", vehicle.getNextServiceDate() != null ? vehicle.getNextServiceDate().toString() : "-");

        // Get assigned driver if any - FIXED: use correct field name
        if (vehicle.getAssignedDrivers() != null && !vehicle.getAssignedDrivers().isEmpty()) {
            User driver = vehicle.getAssignedDrivers().iterator().next();
            vehicleMap.put("assignedDriver", "DRV" + String.format("%03d", driver.getId()));
        }

        return vehicleMap;
    }

    public Map<String, Object> createVehicle(
            String vehicleName,
            String registrationNumber,
            String model,
            String typeStr,
            String capacityStr,
            String lastServiceDate,
            String nextServiceDate,
            String statusStr
    ) {
        Map<String, Object> response = new HashMap<>();

        // Validation
        if (vehicleName == null || vehicleName.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Vehicle name is required");
            return response;
        }

        if (registrationNumber == null || registrationNumber.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Registration number is required");
            return response;
        }

        // Check if registration number already exists
        if (vehicleRepository.existsByRegistrationNumber(registrationNumber)) {
            response.put("success", false);
            response.put("message", "Registration number already exists");
            return response;
        }

        // Parse type
        Vehicle.VehicleType type;
        try {
            type = typeStr != null ? Vehicle.VehicleType.valueOf(typeStr.toUpperCase()) : Vehicle.VehicleType.CAR;
        } catch (IllegalArgumentException e) {
            type = Vehicle.VehicleType.CAR;
        }

        // Parse capacity
        int capacity;
        try {
            capacity = capacityStr != null ? Integer.parseInt(capacityStr) : 4;
        } catch (NumberFormatException e) {
            capacity = 4;
        }

        // Parse status
        Vehicle.VehicleStatus status;
        try {
            status = statusStr != null ? Vehicle.VehicleStatus.valueOf(statusStr.toUpperCase().replace("-", "_")) : Vehicle.VehicleStatus.ACTIVE;
        } catch (IllegalArgumentException e) {
            status = Vehicle.VehicleStatus.ACTIVE;
        }

        // Parse dates
        LocalDate lastService = lastServiceDate != null ? LocalDate.parse(lastServiceDate) : LocalDate.now();
        LocalDate nextService = nextServiceDate != null ? LocalDate.parse(nextServiceDate) : LocalDate.now().plusMonths(6);

        // Create new vehicle
        Vehicle vehicle = Vehicle.builder()
                .vehicleName(vehicleName.trim())
                .registrationNumber(registrationNumber.trim())
                .model(model != null && !model.trim().isEmpty() ? model.trim() : "Unknown Model")
                .type(type)
                .capacity(capacity)
                .lastServiceDate(lastService)
                .nextServiceDate(nextService)
                .status(status)
                .build();

        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        // Build response
        response.put("success", true);
        response.put("message", "Vehicle created successfully");
        response.put("vehicleId", savedVehicle.getId());
        response.put("vehicleName", savedVehicle.getVehicleName());
        response.put("registrationNumber", savedVehicle.getRegistrationNumber());

        return response;
    }
}