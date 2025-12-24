package com.example.fleet_track.models;
import jakarta.persistence.*;

import java.util.*;
enum UserRole { ADMIN, DRIVER }
enum UserStatus { ACTIVE, INACTIVE, ONTRIP }

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private UserRole role; // enum UserRole { ADMIN, DRIVER }

    private String name;
    private String mailId;
    private String phoneNumber;
    private int totalTrips;
    private float ratings;

    @Enumerated(EnumType.STRING)
    private UserStatus status; // enum UserStatus { ACTIVE, INACTIVE, ONTRIP }

    @ManyToMany
    @JoinTable(
            name = "user_vehicle_assignments",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "vehicle_id")
    )
    private Set<Vehicle> assignedVehicles = new HashSet<>();
}
