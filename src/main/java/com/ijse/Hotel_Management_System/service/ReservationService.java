package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.BookingRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.BookingResponse;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.enumeration.BookingStatus;

import java.util.List;

public interface ReservationService {
    BookingResponse createBooking(String requesterEmail, BookingRequest request);
    BookingResponse findById(Long id);
    List<BookingResponse> findByUser(Long userId);
    List<BookingResponse> findAll();
    BookingResponse updateStatus(Long id, BookingStatus status);
    void cancel(String requesterEmail, Long id);
}
