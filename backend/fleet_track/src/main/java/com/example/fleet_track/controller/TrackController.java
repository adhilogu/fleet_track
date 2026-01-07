package com.example.fleet_track.controller;

import com.example.fleet_track.models.Vehicle;
import com.example.fleet_track.service.TrackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/track")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TrackController {

    private final TrackService trackService;

    @GetMapping("/vehicles/all")
    public ResponseEntity<List<Map<String, Object>>> getAllVehiclesWithDetails() {
        return ResponseEntity.ok(trackService.getAllVehiclesWithDetails());
    }

    @GetMapping("/vehicles/search")
    public ResponseEntity<Map<String, Object>> searchVehiclesAndDrivers(
            @RequestParam String query) {
        return ResponseEntity.ok(trackService.searchVehiclesAndDrivers(query));
    }

    @GetMapping("/vehicles/{vehicleId}")
    public ResponseEntity<Map<String, Object>> getVehicleDetails(
            @PathVariable Long vehicleId) {
        return ResponseEntity.ok(trackService.getVehicleDetailsById(vehicleId));
    }

    @GetMapping("/drivers/{driverId}/vehicle")
    public ResponseEntity<Map<String, Object>> getVehicleByDriverId(
            @PathVariable Long driverId) {
        return ResponseEntity.ok(trackService.getVehicleDetailsByDriverId(driverId));
    }

    @GetMapping("/vehicles/tracked")
    public ResponseEntity<List<Map<String, Object>>> getTrackedVehicles() {
        return ResponseEntity.ok(trackService.getTrackedVehicles());
    }

    @GetMapping("/vehicles/untracked")
    public ResponseEntity<List<Map<String, Object>>> getUntrackedVehicles() {
        return ResponseEntity.ok(trackService.getUntrackedVehicles());
    }

    @PutMapping("/vehicles/{vehicleId}/location")
    public ResponseEntity<Map<String, Object>> updateVehicleLocation(
            @PathVariable Long vehicleId,
            @RequestBody Map<String, Double> location) {
        Double latitude = location.get("latitude");
        Double longitude = location.get("longitude");
        return ResponseEntity.ok(trackService.updateVehicleLocation(vehicleId, latitude, longitude));
    }
}