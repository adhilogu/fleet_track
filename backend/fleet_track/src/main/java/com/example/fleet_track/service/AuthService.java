// File: src/main/java/com/example/fleet_track/services/AuthService.java
package com.example.fleet_track.service;

import com.example.fleet_track.models.User;
import com.example.fleet_track.repository.UserRepository;
import com.example.fleet_track.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public Map<String, Object> register(String username, String password, String name ,String mail_id,String phone_number) {
        Map<String, Object> response = new HashMap<>();

        // Check if username already exists
        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Username and password are required");
            return response;
        }

        if (userRepository.existsByUsername(username)) {
            response.put("success", false);
            response.put("message", "Username already exists");
            return response;
        }

        // Create new user
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .name(name != null ? name : "Default User")
                .role(User.UserRole.DRIVER)
                .status(User.UserStatus.ACTIVE)
                .mailId(mail_id)
                .phoneNumber(phone_number)
                .build();

        userRepository.save(user);

        // Generate JWT token
        String token = jwtUtil.generateToken(user);

        response.put("success", true);
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole().name());
        response.put("userId", user.getId());
        response.put("message", "User registered successfully");

        return response;
    }

    public Map<String, Object> login(String username, String password) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            User user = (User) authentication.getPrincipal();

            // Generate JWT token
            String token = jwtUtil.generateToken(user);

            response.put("success", true);
            response.put("token", token);
            response.put("username", user.getUsername());
            response.put("role", user.getRole().name());
            response.put("userId", user.getId());
            response.put("name", user.getName());
            response.put("message", "Login successful");

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Invalid username or password");
        }

        return response;
    }
}