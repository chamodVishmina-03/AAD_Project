package com.ijse.Hotel_Management_System.controller;

import com.ijse.Hotel_Management_System.dto.request.PaymentRequest;
import com.ijse.Hotel_Management_System.dto.response.PaymentResponse;
import com.ijse.Hotel_Management_System.security.UserPrincipal;
import com.ijse.Hotel_Management_System.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> pay(@AuthenticationPrincipal UserPrincipal principal,
                                                 @Valid @RequestBody PaymentRequest request) {
        PaymentResponse response = paymentService.pay(principal.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentResponse> findByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.findByBooking(bookingId));
    }
}
