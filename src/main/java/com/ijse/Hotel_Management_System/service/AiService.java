package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.response.ChatResponse;
import com.ijse.Hotel_Management_System.dto.response.ReviewSummaryResponse;

public interface AiService {
    ReviewSummaryResponse summarizeHotelReviews(Long hotelId, boolean forceRegenerate);
    ChatResponse chat(String message);
}
