package com.ijse.HOTEL_MANAGEMENT_SYSTEM.controller;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.AmenityRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.Amenity;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.AmenityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/amenities")
@RequiredArgsConstructor
public class AmenityController {

    private final AmenityService amenityService;

    @GetMapping
    public ResponseEntity<List<Amenity>> findAll() {
        return ResponseEntity.ok(amenityService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<Amenity> create(@Valid @RequestBody AmenityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(amenityService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<Amenity> update(@PathVariable Long id, @Valid @RequestBody AmenityRequest request) {
        return ResponseEntity.ok(amenityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        amenityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
