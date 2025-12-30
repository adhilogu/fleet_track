// File: src/main/java/com/example/fleet_track/models/Vehicle.java (Cleaned-up version: Removed redundant manual getters/setters since Lombok handles them;
// Fixed getID() to getId(); Ensured consistent naming and imports)
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

    public enum VehicleType { BUS, CAR, TRUCK }
    public enum VehicleStatus { ACTIVE, INACTIVE, SERVICE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String vehicleName;
    @Column(name = "registration_number", unique = true)
    private String registrationNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType type;

    @Column(nullable = false)
    private int capacity;

    @Column(nullable = false)
    private float fuelLevel = 100.0f; // Default full

    @Column(nullable = false)
    private float mileage = 0.0f;

    @Column(nullable = false)
    private String currentLocation = "Depot"; // Default

    private LocalDate serviceDate;
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