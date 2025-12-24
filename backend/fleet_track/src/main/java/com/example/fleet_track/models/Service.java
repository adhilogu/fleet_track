package com.example.fleet_track.models;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

enum ServiceStatus { COMPLETED, PENDING, OVERDUE }

@Entity
@Table(name = "services")
public class Service {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String serviceName;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    private LocalDate serviceDate;
    private LocalDate nextServiceDate;
    private String notes;
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private ServiceStatus status; // enum ServiceStatus { COMPLETED, PENDING, OVERDUE }
}
