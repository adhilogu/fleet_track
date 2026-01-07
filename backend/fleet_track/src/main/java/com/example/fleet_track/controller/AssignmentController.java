package com.example.fleet_track.controller;

import com.example.fleet_track.models.Assignment;
import com.example.fleet_track.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AssignmentController {

    private final AssignmentService assignmentService;


    @GetMapping
    public ResponseEntity<List<Assignment>> getAllAssignments() {
        //System.out.println("🔥 all assignent HIT ");
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    /* ================= GET BY ID ================= */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAssignmentById(@PathVariable Long id) {

        var optional = assignmentService.getAssignmentById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Assignment not found with ID: " + id));
        }

        return ResponseEntity.ok(optional.get());
    }



    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAssignment(@RequestBody Assignment assignment) {
        //System.out.println("🔥 create HIT 🔥");
    return  ResponseEntity.ok(assignmentService.createAssignment(assignment));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAssignment(
            @PathVariable Long id,
            @RequestBody Assignment assignment
    ) {
        try {
            Assignment updated = assignmentService.updateAssignment(id, assignment);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long id) {
        try {
            assignmentService.deleteAssignment(id);
            return ResponseEntity.ok(new SuccessResponse("Assignment deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    private record ErrorResponse(String message) {}
    private record SuccessResponse(String message) {}
}
