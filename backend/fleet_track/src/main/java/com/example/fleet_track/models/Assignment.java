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

    public enum AssignmentStatus {
        COMPLETED,
        CANCELLED,
        IN_PROGRESS
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String assignmentName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private User driver;

    /* ================= COORDINATES ================= */
    @Column(name = "start_latitude")
    private Double startLatitude;

    @Column(name = "start_longitude")
    private Double startLongitude;

    @Column(name = "end_latitude")
    private Double endLatitude;

    @Column(name = "end_longitude")
    private Double endLongitude;

    /* ================= LOCATION TEXT ================= */
    private String startLocation;
    private String dropLocation;

    /* ================= ROUTE ================= */
    private Double routeDistance;

    /* ================= TIME ================= */
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    /* ================= STATUS ================= */
    @Enumerated(EnumType.STRING)
    private AssignmentStatus status = AssignmentStatus.IN_PROGRESS;
}
