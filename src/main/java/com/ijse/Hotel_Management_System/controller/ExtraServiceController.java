package com.ijse.HOTEL_MANAGEMENT_SYSTEM.controller;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.ExtraServiceRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.ExtraService;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.ExtraServiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/extra-services")
@RequiredArgsConstructor
public class ExtraServiceController {

    private final ExtraServiceService extraServiceService;

    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<ExtraService>> findByHotel(@PathVariable Long hotelId) {
        return ResponseEntity.ok(extraServiceService.findByHotel(hotelId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExtraService> findById(@PathVariable Long id) {
        return ResponseEntity.ok(extraServiceService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ExtraService> create(@Valid @RequestBody ExtraServiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(extraServiceService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ExtraService> update(@PathVariable Long id, @Valid @RequestBody ExtraServiceRequest request) {
        return ResponseEntity.ok(extraServiceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        extraServiceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
