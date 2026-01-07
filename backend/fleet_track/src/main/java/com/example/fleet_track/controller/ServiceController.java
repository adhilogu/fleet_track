package com.example.fleet_track.controller;

import com.example.fleet_track.models.Service;
import com.example.fleet_track.models.Vehicle;
import com.example.fleet_track.repository.VehicleRepository;
import com.example.fleet_track.service.ServiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "*")
public class ServiceController {

    @Autowired
    private ServiceService serviceService;

    @Autowired
    private VehicleRepository vehicleRepository;  // ← NEW

    @GetMapping
    public List<Service> getAllServices() {
        return serviceService.getAllServices();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Service> getServiceById(@PathVariable("id") Long id) {
        return serviceService.getServiceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Service> createService(@RequestBody Map<String, Object> request) {
        // Extract vehicleId from the request map
        Object vehicleObj = request.get("vehicle");
        Long vehicleId = null;  // Declare here

        if (vehicleObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> vehicleMap = (Map<String, Object>) vehicleObj;
            Object idObj = vehicleMap.get("id");
            vehicleId = idObj instanceof Number ? ((Number) idObj).longValue() : null;
        }

        if (vehicleId == null) {
            return ResponseEntity.badRequest().body(null);
        }

        // Now vehicleId is accessible here
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " ));

        // Create Service object
        Service service = new Service();
        service.setVehicle(vehicle);
        service.setServiceName((String) request.get("serviceName"));
        service.setServiceDate(request.get("serviceDate") != null ?
                LocalDate.parse((String) request.get("serviceDate")) : null);
        service.setNextServiceDate(request.get("nextServiceDate") != null ?
                LocalDate.parse((String) request.get("nextServiceDate")) : null);
        service.setNotes((String) request.get("notes"));
        service.setAmount(request.get("amount") != null ?
                java.math.BigDecimal.valueOf(((Number) request.get("amount")).doubleValue()) :
                java.math.BigDecimal.ZERO);
        service.setStatus(request.get("status") != null ?
                Service.ServiceStatus.valueOf((String) request.get("status")) :
                Service.ServiceStatus.PENDING);

        Service created = serviceService.createService(service);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Service> updateService(
            @PathVariable("id") Long id,
            @RequestBody Service request) {

        // Load existing service first
        Service existing = serviceService.getServiceById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        // Update scalar fields
        existing.setServiceName(request.getServiceName());
        existing.setServiceDate(request.getServiceDate());
        existing.setNextServiceDate(request.getNextServiceDate());
        existing.setNotes(request.getNotes());
        existing.setAmount(request.getAmount());
        existing.setStatus(request.getStatus());

        // Handle vehicle change (if frontend sends new vehicleId)
        if (request.getVehicle() != null && request.getVehicle().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(request.getVehicle().getId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            existing.setVehicle(vehicle);
        }

        Service updated = serviceService.updateService(id, existing);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteService(@PathVariable("id") Long id) {
        serviceService.deleteService(id);
        return ResponseEntity.noContent().build();
    }
}