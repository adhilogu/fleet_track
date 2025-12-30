// File: src/main/java/com/example/fleet_track/models/User.java (Simplified for username/password focus; enums and other fields retained for compatibility, but register/login only use username/password)
package com.example.fleet_track.models;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"password", "assignedVehicles"})
public class User implements UserDetails {

    public enum UserRole { ADMIN, DRIVER }
    public enum UserStatus { ACTIVE, INACTIVE, ONTRIP }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.DRIVER; // Default to DRIVER

    @Column(nullable = false)
    private String name = "Default User"; // Default

    private Long profile_photo;

    @Column(unique = true, nullable = false)
    private String username; // login

    @Column(nullable = false)
    private String password; // password (BCrypt)

    @Column(unique = true, nullable = false)
    private String mailId = "-"; // Optional for now

    @Column(unique = true, nullable = false)
    private String phoneNumber = "-"; // Optional for now

    private int totalTrips = 0;

    private float ratings = 0.0f;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @ManyToMany
    @JoinTable(
            name = "user_vehicle_assignments",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "vehicle_id")
    )
    private Set<Vehicle> assignedVehicles; // Assume Vehicle exists; ignore for auth

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }
}