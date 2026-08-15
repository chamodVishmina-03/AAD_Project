package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.ReviewRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.ReviewResponse;

import java.util.List;

public interface ReviewService {
    ReviewResponse create(String requesterEmail, ReviewRequest request);
    List<ReviewResponse> findByHotel(Long hotelId);
    void delete(String requesterEmail, Long id);
}
