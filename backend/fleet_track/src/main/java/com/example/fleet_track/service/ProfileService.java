package com.example.fleet_track.service;

import com.example.fleet_track.models.User;
import com.example.fleet_track.models.Vehicle;
import com.example.fleet_track.repository.UserRepository;
import com.example.fleet_track.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
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


    public Map<String, Object> getMyProfile(Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "User not found");
                return response;
            }
            User user = userOpt.get();
            Map<String, Object> profileData = new HashMap<>();
            profileData.put("id", user.getId());
            profileData.put("name", user.getName());
            profileData.put("email", user.getMailId());
            profileData.put("phone", user.getPhoneNumber());
            profileData.put("username", user.getUsername());
            profileData.put("role", user.getRole().name());
            profileData.put("photo", user.getProfilePhoto());
            profileData.put("createdDate", new Date().toString());

            // If user is a driver, get driver details and assigned vehicle
            if (user.getRole() == User.UserRole.DRIVER) {
                profileData.put("driverId", user.getId());
                profileData.put("licenseNumber", "DL-" + user.getId());
                profileData.put("status", user.getStatus().name());
                profileData.put("totalTrips", user.getTotalTrips());
                profileData.put("rating", user.getRatings());
                profileData.put("joinedDate", new Date().toString());

                // Get assigned vehicle if exists
                if (user.getAssignedVehicles() != null && !user.getAssignedVehicles().isEmpty()) {
                    Vehicle vehicle = user.getAssignedVehicles().iterator().next();
                    Map<String, Object> vehicleData = new HashMap<>();
                    vehicleData.put("id", vehicle.getId());
                    vehicleData.put("name", vehicle.getVehicleName());
                    vehicleData.put("plateNumber", vehicle.getRegistrationNumber());
                    vehicleData.put("model", vehicle.getModel());
                    vehicleData.put("type", vehicle.getType().name());
                    vehicleData.put("capacity", vehicle.getCapacity());
                    vehicleData.put("status", vehicle.getStatus().name());
                    vehicleData.put("lastServiceDate", vehicle.getLastServiceDate() != null ? vehicle.getLastServiceDate().toString() : "-");
                    vehicleData.put("nextServiceDate", vehicle.getNextServiceDate() != null ? vehicle.getNextServiceDate().toString() : "-");

                    profileData.put("assignedVehicle", vehicleData);
                }
            }

            response.put("success", true);
            response.put("profile", profileData);
            return response;

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error fetching profile: " + e.getMessage());
            return response;
        }
    }







    public Map<String, Object> getAllUsers() {
        Map<String, Object> response = new HashMap<>();

        List<User> users = userRepository.findAll();

        List<Map<String, Object>> userList = users.stream()
                .filter(user -> user.getRole() != User.UserRole.DRIVER)
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());

        response.put("success", true);
        response.put("users", userList);
        response.put("count", userList.size());

        return response;
    }


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

        userMap.put("id", user.getId());
        userMap.put("name", user.getName());
        userMap.put("email", user.getMailId());
        userMap.put("phone", user.getPhoneNumber());
        userMap.put("username", user.getUsername());
        userMap.put("role", user.getRole().name().toLowerCase());
        userMap.put("createdDate", new Date().toString());
        userMap.put("status", user.getStatus().name().toLowerCase());
        userMap.put("photo", user.getProfilePhoto());

        return userMap;
    }

    private Map<String, Object> mapDriverToResponse(User driver) {
        Map<String, Object> driverMap = new HashMap<>();

        driverMap.put("id", driver.getId());
        driverMap.put("name", driver.getName());
        driverMap.put("email", driver.getMailId());
        driverMap.put("phone", driver.getPhoneNumber());
        driverMap.put("licenseNumber", "DL-" + driver.getId());
        driverMap.put("status", driver.getStatus().name().toLowerCase().replace("_", "-"));
        driverMap.put("totalTrips", driver.getTotalTrips());
        driverMap.put("rating", driver.getRatings());
        driverMap.put("joinedDate", new Date().toString());
        driverMap.put("photo", driver.getProfilePhoto());

        // FIXED: Changed from assignedVehicleId to assignedVehicle
        if (driver.getAssignedVehicles() != null && !driver.getAssignedVehicles().isEmpty()) {
            Vehicle vehicle = driver.getAssignedVehicles().iterator().next();
            driverMap.put("assignedVehicle", vehicle.getId());
        }

        return driverMap;
    }

    private Map<String, Object> mapVehicleToResponse(Vehicle vehicle) {
        Map<String, Object> vehicleMap = new HashMap<>();

        vehicleMap.put("id", vehicle.getId());
        vehicleMap.put("name", vehicle.getVehicleName());
        vehicleMap.put("plateNumber", vehicle.getRegistrationNumber());
        vehicleMap.put("model", vehicle.getModel() != null ? vehicle.getModel() : "Unknown Model");
        vehicleMap.put("type", vehicle.getType().name().toLowerCase());
        vehicleMap.put("capacity", vehicle.getCapacity());
        vehicleMap.put("status", vehicle.getStatus().name().toLowerCase().replace("_", "-"));
        vehicleMap.put("vehicle_location_status", vehicle.getVehicleLocationStatus().name().toLowerCase().replace("_", "-"));
        vehicleMap.put("lastServiceDate",
                vehicle.getLastServiceDate() != null ? vehicle.getLastServiceDate().toString() : "-");
        vehicleMap.put("nextServiceDate",
                vehicle.getNextServiceDate() != null ? vehicle.getNextServiceDate().toString() : "-");

        // FIXED: Changed from assignedDriverId to assignedDriver
        if (vehicle.getAssignedDrivers() != null && !vehicle.getAssignedDrivers().isEmpty()) {
            User driver = vehicle.getAssignedDrivers().iterator().next();
            vehicleMap.put("assignedDriver", driver.getId());
        }

        return vehicleMap;
    }


    //Create new user
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> createUser(
            String username,
            String password,
            String name,
            String mailId,
            String phoneNumber,
            String roleStr,
            MultipartFile photo) {

        Map<String, Object> response = new HashMap<>();


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

   //################################## ADMIN ONLY CONTENTS     #########################################

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

    //Create Vehicle
    @PreAuthorize("hasRole('ADMIN')")
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

    //Update user
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> updateUser(Long id, Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> userOpt = userRepository.findById(id);
        if (!userOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "User not found");
            return response;
        }

        User user = userOpt.get();

        if (request.containsKey("name")) user.setName(request.get("name"));
        if (request.containsKey("mailId")) user.setMailId(request.get("mailId"));
        if (request.containsKey("phoneNumber")) user.setPhoneNumber(request.get("phoneNumber"));
        if (request.containsKey("username")) user.setUsername(request.get("username"));

        if (request.containsKey("role")) {
            try {
                User.UserRole role = User.UserRole.valueOf(request.get("role").toUpperCase());
                user.setRole(role);
            } catch (IllegalArgumentException e) {
                response.put("success", false);
                response.put("message", "Invalid role");
                return response;
            }
        }

        userRepository.save(user);

        response.put("success", true);
        response.put("message", "User updated successfully");
        return response;
    }


    // update Driver
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> updateDriver(Long id, Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> driverOpt = userRepository.findById(id);
        if (!driverOpt.isPresent() || driverOpt.get().getRole() != User.UserRole.DRIVER) {
            response.put("success", false);
            response.put("message", "Driver not found");
            return response;
        }

        User driver = driverOpt.get();

        if (request.containsKey("name")) driver.setName(request.get("name"));
        if (request.containsKey("mailId")) driver.setMailId(request.get("mailId"));
        if (request.containsKey("phoneNumber")) driver.setPhoneNumber(request.get("phoneNumber"));

        if (request.containsKey("status")) {
            try {
                User.UserStatus status = User.UserStatus.valueOf(request.get("status").toUpperCase().replace("-", "_"));
                driver.setStatus(status);
            } catch (IllegalArgumentException e) {
                response.put("success", false);
                response.put("message", "Invalid status");
                return response;
            }
        }

        userRepository.save(driver);

        response.put("success", true);
        response.put("message", "Driver updated successfully");
        return response;
    }

    //Update Vehicle
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> updateVehicle(Long id, Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();

        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(id);
        if (!vehicleOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "Vehicle not found");
            return response;
        }

        Vehicle vehicle = vehicleOpt.get();

        if (request.containsKey("vehicleName")) vehicle.setVehicleName(request.get("vehicleName"));
        if (request.containsKey("registrationNumber")) vehicle.setRegistrationNumber(request.get("registrationNumber"));
        if (request.containsKey("model")) vehicle.setModel(request.get("model"));

        if (request.containsKey("type")) {
            try {
                Vehicle.VehicleType type = Vehicle.VehicleType.valueOf(request.get("type").toUpperCase());
                vehicle.setType(type);
            } catch (IllegalArgumentException e) {
                response.put("success", false);
                response.put("message", "Invalid vehicle type");
                return response;
            }
        }

        if (request.containsKey("capacity")) {
            try {
                vehicle.setCapacity(Integer.parseInt(request.get("capacity")));
            } catch (NumberFormatException e) {
                response.put("success", false);
                response.put("message", "Invalid capacity");
                return response;
            }
        }

        if (request.containsKey("status")) {
            try {
                Vehicle.VehicleStatus status = Vehicle.VehicleStatus.valueOf(
                        request.get("status").toUpperCase().replace("-", "_")
                );
                vehicle.setStatus(status);
            } catch (IllegalArgumentException e) {
                response.put("success", false);
                response.put("message", "Invalid status");
                return response;
            }
        }

        if (request.containsKey("lastServiceDate")) {
            vehicle.setLastServiceDate(LocalDate.parse(request.get("lastServiceDate")));
        }
        if (request.containsKey("nextServiceDate")) {
            vehicle.setNextServiceDate(LocalDate.parse(request.get("nextServiceDate")));
        }

        vehicleRepository.save(vehicle);

        response.put("success", true);
        response.put("message", "Vehicle updated successfully");
        return response;
    }

    //Delete User
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> deleteUser(Long id) {
        Map<String, Object> response = new HashMap<>();

        if (!userRepository.existsById(id)) {
            response.put("success", false);
            response.put("message", "User not found");
            return response;
        }

        userRepository.deleteById(id);

        response.put("success", true);
        response.put("message", "User deleted successfully");
        return response;
    }

    //Delete Driver
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> deleteDriver(Long id) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> driverOpt = userRepository.findById(id);
        if (!driverOpt.isPresent() || driverOpt.get().getRole() != User.UserRole.DRIVER) {
            response.put("success", false);
            response.put("message", "Driver not found");
            return response;
        }

        userRepository.deleteById(id);

        response.put("success", true);
        response.put("message", "Driver deleted successfully");
        return response;
    }

    //Delete VEhcile
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> deleteVehicle(Long id) {
        Map<String, Object> response = new HashMap<>();

        if (!vehicleRepository.existsById(id)) {
            response.put("success", false);
            response.put("message", "Vehicle not found");
            return response;
        }

        vehicleRepository.deleteById(id);

        response.put("success", true);
        response.put("message", "Vehicle deleted successfully");
        return response;
    }
}