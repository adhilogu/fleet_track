package com.example.fleet_track.models;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.*;

enum VehicleType { BUS, CAR, TRUCK }
enum VehicleStatus { ACTIVE, INACTIVE }

@Entity
@Table(name = "vehicles")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String vehicleName;
    private String registrationNumber;

    @Enumerated(EnumType.STRING)
    private VehicleType type; // enum VehicleType { BUS, CAR, TRUCK }

    private int capacity;
    private float fuelLevel;
    private float mileage;
    private String currentLocation;
    private LocalDate serviceDate;
    private LocalDate nextServiceDate;

    @Enumerated(EnumType.STRING)
    private VehicleStatus status; // enum VehicleStatus { ACTIVE, INACTIVE }

    @ManyToMany(mappedBy = "assignedVehicles")
    private Set<User> assignedDrivers = new HashSet<>();

    @OneToMany(mappedBy = "vehicle")
    private List<Service> services;

    @OneToMany(mappedBy = "vehicle")
    private List<Assignment> assignments;
}
