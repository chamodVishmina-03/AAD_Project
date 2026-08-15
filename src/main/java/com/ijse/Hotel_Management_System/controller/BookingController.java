package com.ijse.Hotel_Management_System.controller;

import com.ijse.Hotel_Management_System.dto.request.BookingRequest;
import com.ijse.Hotel_Management_System.dto.response.BookingResponse;
import com.ijse.Hotel_Management_System.enumeration.BookingStatus;
import com.ijse.Hotel_Management_System.security.UserPrincipal;
import com.ijse.Hotel_Management_System.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<BookingResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                                    @Valid @RequestBody BookingRequest request) {
        BookingResponse response = reservationService.createBooking(principal.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.findById(id));
    }

    @GetMapping("/me")
    public ResponseEntity<List<BookingResponse>> myBookings(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reservationService.findByUser(principal.getId()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<List<BookingResponse>> findAll() {
        return ResponseEntity.ok(reservationService.findAll());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<BookingResponse> updateStatus(@PathVariable Long id, @RequestParam BookingStatus status) {
        return ResponseEntity.ok(reservationService.updateStatus(id, status));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancel(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        reservationService.cancel(principal.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
