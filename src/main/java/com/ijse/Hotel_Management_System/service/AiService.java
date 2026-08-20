package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.constant.CommonResponse;
import com.ijse.Hotel_Management_System.dto.response.ChatResponse;

public interface AiService {
   CommonResponse summarizeHotelReviews(Long hotelId, boolean forceRegenerate);
    ChatResponse chat(String message);



}
