package com.ijse.Hotel_Management_System.controller;

import com.ijse.Hotel_Management_System.dto.request.ReviewRequest;
import com.ijse.Hotel_Management_System.dto.response.ReviewResponse;
import com.ijse.Hotel_Management_System.security.UserPrincipal;
import com.ijse.Hotel_Management_System.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                                   @Valid @RequestBody ReviewRequest request) {
        ReviewResponse response = reviewService.create(principal.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<ReviewResponse>> findByHotel(@PathVariable Long hotelId) {
        return ResponseEntity.ok(reviewService.findByHotel(hotelId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        reviewService.delete(principal.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
