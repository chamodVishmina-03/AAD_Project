package com.ijse.Hotel_Management_System.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long hotelId;
    private String hotelName;
    private String reviewerName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}