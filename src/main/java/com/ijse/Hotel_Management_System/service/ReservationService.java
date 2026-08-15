package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.request.BookingRequest;
import com.ijse.Hotel_Management_System.dto.response.BookingResponse;
import com.ijse.Hotel_Management_System.enumeration.BookingStatus;

import java.util.List;

public interface ReservationService {
    BookingResponse createBooking(String requesterEmail, BookingRequest request);
    BookingResponse findById(Long id);
    List<BookingResponse> findByUser(Long userId);
    List<BookingResponse> findAll();
    BookingResponse updateStatus(Long id, BookingStatus status);
    void cancel(String requesterEmail, Long id);
}
