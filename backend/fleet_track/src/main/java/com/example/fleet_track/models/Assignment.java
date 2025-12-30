package com.example.fleet_track.models;
import jakarta.persistence.*;

import java.time.LocalDateTime;

enum AssignmentStatus { COMPLETED, CANCELLED, IN_PROGRESS }

@Entity
@Table(name = "assignments")
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String assignmentName;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    private String startLocation;
    private String dropLocation;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    private AssignmentStatus status; // enum AssignmentStatus { COMPLETED, CANCELLED, IN_PROGRESS }
}
