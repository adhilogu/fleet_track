package com.example.fleet_track.service;

import com.example.fleet_track.models.Service;
import com.example.fleet_track.models.Vehicle;
import com.example.fleet_track.repository.ServiceRepository;
import com.example.fleet_track.repository.VehicleRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@org.springframework.stereotype.Service
public class ServiceService {

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    public List<Service> getAllServices() {
        return serviceRepository.findAll();
    }

    public Optional<Service> getServiceById(Long id) {
        return serviceRepository.findById(id);
    }

    public Service createService(Service request) {
        Long vehicleId = request.getVehicle() != null ? request.getVehicle().getId() : null;

        if (vehicleId == null) {
            throw new RuntimeException("Vehicle ID is required");
        }

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));

        Service service = new Service();
        service.setVehicle(vehicle);
        service.setServiceName(request.getServiceName());
        service.setServiceDate(request.getServiceDate());
        service.setNextServiceDate(request.getNextServiceDate());
        service.setNotes(request.getNotes());
        service.setAmount(request.getAmount());
        service.setStatus(request.getStatus());

        return serviceRepository.save(service);
    }

    @Transactional
    public Service updateService(Long id, Service updatedService) {
        Service existing = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        // Since we're passing the full updated object now, just save it
        return serviceRepository.save(updatedService);
    }

    public void deleteService(Long id) {
        serviceRepository.deleteById(id);
    }
}