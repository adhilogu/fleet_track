package com.example.fleet_track.controller;

import com.example.fleet_track.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/profiles")
@CrossOrigin(origins = "*")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    // ==================== USER ENDPOINTS ====================

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createUser(
            @RequestParam("username") String username,
            @RequestParam("password") String password,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "mailId", required = false) String mailId,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "role", required = false) String roleStr,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {

        Map<String, Object> response = profileService.createUser(
                username, password, name, mailId, phoneNumber, roleStr, photo);

        return (Boolean) response.get("success")
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        return ResponseEntity.ok(profileService.getAllUsers());
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        Map<String, Object> response = profileService.updateUser(id, request);
        return (Boolean) response.get("success")
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        Map<String, Object> response = profileService.deleteUser(id);
        return (Boolean) response.get("success")
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    // ==================== DRIVER ENDPOINTS ====================

    @GetMapping("/drivers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllDrivers() {
        return ResponseEntity.ok(profileService.getAllDrivers());
    }

    @PutMapping("/drivers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateDriver(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        Map<String, Object> response = profileService.updateDriver(id, request);
        return (Boolean) response.get("success")
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @DeleteMapping("/drivers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteDriver(@PathVariable Long id) {
        Map<String, Object> response = profileService.deleteDriver(id);
        return (Boolean) response.get("success")
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    // ==================== VEHICLE ENDPOINTS ====================

    @GetMapping("/vehicles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllVehicles() {
        return ResponseEntity.ok(profileService.getAllVehicles());
    }

    @PostMapping("/vehicles/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createVehicle(@RequestBody Map<String, String> request) {
        Map<String, Object> response = profileService.createVehicle(
                request.get("vehicleName"),
                request.get("registrationNumber"),
                request.get("model"),
                request.get("type"),
                request.get("capacity"),
                request.get("lastServiceDate"),
                request.get("nextServiceDate"),
                request.get("status")
        );

        return (Boolean) response.get("success")
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @PutMapping("/vehicles/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateVehicle(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        Map<String, Object> response = profileService.updateVehicle(id, request);
        return (Boolean) response.get("success")
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @DeleteMapping("/vehicles/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteVehicle(@PathVariable Long id) {
        Map<String, Object> response = profileService.deleteVehicle(id);
        return (Boolean) response.get("success")
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }
}