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
    private UserRole role;

    @Column(nullable = false)
    private String name;

    @Column(name = "profile_photo")
    private String profilePhoto;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true)
    private String mailId;   // optional but unique

    @Column(unique = true)
    private String phoneNumber; // optional but unique

    private Integer totalTrips;
    private Float ratings;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    @ManyToMany
    @JoinTable(
            name = "user_vehicle_assignments",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "vehicle_id")
    )
    private Set<Vehicle> assignedVehicles;

    /* ================= DEFAULT SAFETY ================= */

    @PrePersist
    public void applyDefaults() {

        if (role == null)
            role = UserRole.DRIVER;

        if (name == null || name.isBlank())
            name = "Default User";

        if (status == null)
            status = UserStatus.ACTIVE;

        if (totalTrips == null)
            totalTrips = 0;

        if (ratings == null)
            ratings = 0.0f;
    }

    /* ================= SECURITY ================= */

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }
}

/*
* package com.example.fleet_track.models;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
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
    private UserRole role = UserRole.DRIVER;

    @Column(nullable = false)
    private String name = "Default User";

    @Column(name = "profile_photo")
    private String profilePhoto;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String mailId = "-";

    @Column(unique = true, nullable = false)
    private String phoneNumber = "-";

    private Integer totalTrips = 0;

    private Float ratings = 0.0f;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    // ============= SOFT DELETE FIELDS =============
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    // ==============================================

    @ManyToMany
    @JoinTable(
            name = "user_vehicle_assignments",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "vehicle_id")
    )
    private Set<Vehicle> assignedVehicles;

    // Add relationship with assignments for cascade
    @OneToMany(mappedBy = "driver", cascade = CascadeType.ALL, orphanRemoval = false)
    private List<Assignment> assignments;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    public String getProfilePhoto() {
        return profilePhoto;
    }

    public void setProfilePhoto(String profilePhoto) {
        this.profilePhoto = profilePhoto;
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
        return status == UserStatus.ACTIVE && !isDeleted;
    }
}*/