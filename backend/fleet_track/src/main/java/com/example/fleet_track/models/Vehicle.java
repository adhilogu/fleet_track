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
    public enum VehicleStatus { ACTIVE, INACTIVE, SERVICE, IDLE, MAINTENANCE, OUT_OF_SERVICE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String vehicleName;

    @Column(name = "registration_number", unique = true)
    private String registrationNumber;

    // ADD THIS FIELD
    private String model;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType type;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Float fuelLevel = 100.0f;

    @Column(nullable = false)
    private Float mileage = 0.0f;

    @Column(nullable = false)
    private String currentLocation = "Depot";

    // RENAME THIS FIELD
    private LocalDate lastServiceDate;

    private LocalDate nextServiceDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleStatus status = VehicleStatus.ACTIVE;

    @ManyToMany(mappedBy = "assignedVehicles")
    @JsonBackReference("user-vehicles")
    private Set<User> assignedDrivers = new HashSet<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonBackReference("vehicle-services")
    private List<Service> services = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonBackReference("vehicle-assignments")
    private List<Assignment> assignments = new ArrayList<>();
}