package com.example.fleet_track.repository;

import com.example.fleet_track.models.User;
import com.example.fleet_track.models.User.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Original methods
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);

}