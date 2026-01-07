package com.example.fleet_track.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.*;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"assignedDrivers", "services", "assignments"})
public class Vehicle {

    public enum VehicleType { BUS, CAR, TRUCK, CAB }
    public enum VehicleLocationStatusType { TRACKED, UNTRACKED }
    public enum VehicleStatus { ACTIVE, INACTIVE, SERVICE, IDLE, MAINTENANCE, OUT_OF_SERVICE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String vehicleName;

    @Column(name = "registration_number", unique = true, nullable = false)
    private String registrationNumber;

    @Column(name = "vehicle_latitude")
    private Double vehicleLatitude;

    @Column(name = "vehicle_longitude")
    private Double vehicleLongitude;

    private String model;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleLocationStatusType vehicleLocationStatus;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Float fuelLevel;

    @Column(nullable = false)
    private Float mileage;

    @Column(nullable = false)
    private String currentLocation;

    private LocalDate lastServiceDate;
    private LocalDate nextServiceDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleStatus status;

    /* ================= RELATIONS ================= */

    @ManyToMany(mappedBy = "assignedVehicles")
    @JsonBackReference("user-vehicles")
    private Set<User> assignedDrivers = new HashSet<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonBackReference("vehicle-services")
    private List<Service> services = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonBackReference("vehicle-assignments")
    private List<Assignment> assignments = new ArrayList<>();

    /* ================= DEFAULT SAFETY ================= */

    @PrePersist
    public void applyDefaults() {

        if (vehicleLocationStatus == null)
            vehicleLocationStatus = VehicleLocationStatusType.UNTRACKED;

        if (fuelLevel == null)
            fuelLevel = 100.0f;

        if (mileage == null)
            mileage = 0.0f;

        if (currentLocation == null || currentLocation.isBlank())
            currentLocation = "Depot";

        if (status == null)
            status = VehicleStatus.ACTIVE;

        if (model == null || model.isBlank())
            model = "Unknown Model";
    }
}
