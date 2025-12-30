package com.example.fleet_track.controller;

import com.example.fleet_track.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/profiles")
@CrossOrigin(origins = "*")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    /**
     * Admin endpoint to create a new user
     * Requires ADMIN role
     */
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String name = request.get("name");
        String mailId = request.get("mailId");
        String phoneNumber = request.get("phoneNumber");
        String roleStr = request.get("role");

        Map<String, Object> response = profileService.createUser(
                username,
                password,
                name,
                mailId,
                phoneNumber,
                roleStr
        );

        if ((Boolean) response.get("success")) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get all users (for listing in the UI)
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        Map<String, Object> response = profileService.getAllUsers();
        return ResponseEntity.ok(response);
    }

    /**
     * Get all drivers
     */
    @GetMapping("/drivers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllDrivers() {
        Map<String, Object> response = profileService.getAllDrivers();
        return ResponseEntity.ok(response);
    }

    /**
     * Get all vehicles
     */
    @GetMapping("/vehicles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllVehicles() {
        Map<String, Object> response = profileService.getAllVehicles();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/vehicles/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createVehicle(@RequestBody Map<String, String> request) {
        String vehicleName = request.get("vehicleName");
        String registrationNumber = request.get("registrationNumber");
        String model = request.get("model");
        String typeStr = request.get("type");
        String capacityStr = request.get("capacity");
        String lastServiceDate = request.get("lastServiceDate");
        String nextServiceDate = request.get("nextServiceDate");
        String statusStr = request.get("status");

        Map<String, Object> response = profileService.createVehicle(
                vehicleName,
                registrationNumber,
                model,
                typeStr,
                capacityStr,
                lastServiceDate,
                nextServiceDate,
                statusStr
        );

        if ((Boolean) response.get("success")) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}