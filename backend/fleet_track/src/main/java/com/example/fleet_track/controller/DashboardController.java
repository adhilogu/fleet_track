package com.example.fleet_track.controller;

import com.example.fleet_track.models.User;
import com.example.fleet_track.models.User.UserRole;
import com.example.fleet_track.service.ProfileService;
import com.example.fleet_track.service.AssignmentService;
import com.example.fleet_track.service.ServiceService;
import com.example.fleet_track.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.*;


@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final ProfileService profileService;
    private final AssignmentService assignmentService;
    private final ServiceService serviceRecordService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDashboardData() {
        // Additional backend verification - double check user role from database
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        // Fetch user from database to verify actual role
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify user has ADMIN role from database
        if (user.getRole() != UserRole.ADMIN) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Access Denied");
            errorResponse.put("message", "Only administrators can access the dashboard");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        }

        Map<String, Object> dashboardData = new HashMap<>();

        // Fetch data from services
        dashboardData.put("vehicles", profileService.getAllVehicles());
        dashboardData.put("drivers", profileService.getAllDrivers());
        dashboardData.put("users", profileService.getAllUsers());
        dashboardData.put("assignments", assignmentService.getAllAssignments());
        dashboardData.put("services", serviceRecordService.getAllServices());

        return ResponseEntity.ok(dashboardData);
    }
}