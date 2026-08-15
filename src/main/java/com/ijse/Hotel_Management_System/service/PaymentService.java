package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.PaymentRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.PaymentResponse;

public interface PaymentService {
    PaymentResponse pay(String requesterEmail, PaymentRequest request);
    PaymentResponse findByBooking(Long bookingId);
}
