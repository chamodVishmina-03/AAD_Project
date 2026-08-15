package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.response.InvoiceResponse;

public interface InvoiceService {
    InvoiceResponse findByBooking(Long bookingId);
}
