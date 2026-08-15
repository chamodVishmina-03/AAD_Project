package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.request.ReviewRequest;
import com.ijse.Hotel_Management_System.dto.response.ReviewResponse;

import java.util.List;

public interface ReviewService {
    ReviewResponse create(String requesterEmail, ReviewRequest request);
    List<ReviewResponse> findByHotel(Long hotelId);
    void delete(String requesterEmail, Long id);
}
