package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.InvoiceResponse;

public interface InvoiceService {
    InvoiceResponse findByBooking(Long bookingId);
}
