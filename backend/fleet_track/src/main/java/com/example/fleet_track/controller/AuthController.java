// File: src/main/java/com/example/fleet_track/controller/UserController.java
package com.example.fleet_track.controller;

import com.example.fleet_track.models.User;
import com.example.fleet_track.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String name = request.get("name");
        String mail_id = request.get("mail_id");
        String phone_number = request.get("phone_number");

        Map<String, Object> response = authService.register(username, password, name,mail_id,phone_number);
        return ResponseEntity.ok(response);
    }

//   Register template
//   {
//        "username": "adhi",
//        "password": "adhi4444",
//        "mail_id":"adhilogu@gmail.com",
//        "phone_number":9843799917
//    }


    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        Map<String, Object> response = authService.login(username, password);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> test() {
        Map<String, Object> response = new HashMap<>();

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        response.put("message", "Auth endpoint is working!");
        response.put("authenticated", authentication != null && authentication.isAuthenticated());

        if (authentication != null && authentication.getPrincipal() != null) {
            response.put("username", authentication.getName());
            response.put("authorities", authentication.getAuthorities());
        }

        return ResponseEntity.ok(response);
    }


    @GetMapping("/verify")
    public ResponseEntity<?> verifyToken(@AuthenticationPrincipal User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("valid", true);
        response.put("username", user.getUsername());
        response.put("role", user.getRole().name());
        //System.out.println("verify Token.....");
        return ResponseEntity.ok(response);
    }
}