package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.ChatResponse;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.ReviewSummaryResponse;

public interface AiService {
    ReviewSummaryResponse summarizeHotelReviews(Long hotelId, boolean forceRegenerate);
    ChatResponse chat(String message);
}
