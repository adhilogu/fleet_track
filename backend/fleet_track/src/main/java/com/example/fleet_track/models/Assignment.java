package com.example.fleet_track.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"vehicle", "driver"})
public class Assignment {

    public enum AssignmentStatus { COMPLETED, CANCELLED, IN_PROGRESS }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String assignmentName;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;

    // Coordinates for start point
    @Column(name = "start_latitude", nullable = false)
    private double startLatitude;
    @Column(name = "start_longitude", nullable = false)
    private double startLongitude;

    // Coordinates for end point
    @Column(name = "end_latitude", nullable = false)
    private double endLatitude;
    @Column(name = "end_longitude", nullable = false)
    private double endLongitude;

    private String startLocation;
    private String dropLocation;

    private double routeDistance;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    private AssignmentStatus status = AssignmentStatus.IN_PROGRESS;

}