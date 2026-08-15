package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.request.PaymentRequest;
import com.ijse.Hotel_Management_System.dto.response.PaymentResponse;

public interface PaymentService {
    PaymentResponse pay(String requesterEmail, PaymentRequest request);
    PaymentResponse findByBooking(Long bookingId);
}
