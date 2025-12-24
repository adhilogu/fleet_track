// UserRepository.java
package com.example.fleet_track.repository;
import com.example.fleet_track.models.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // You can add custom queries later if needed
    boolean existsByMailId(String mailId);
    boolean existsByPhoneNumber(String phoneNumber);
}