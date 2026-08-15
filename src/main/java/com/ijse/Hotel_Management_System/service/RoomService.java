package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.ImageRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.RoomRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.RoomResponse;

import java.time.LocalDate;
import java.util.List;

public interface RoomService {
    RoomResponse create(RoomRequest request);
    RoomResponse update(Long id, RoomRequest request);
    RoomResponse findById(Long id);
    List<RoomResponse> findByHotel(Long hotelId);
    List<RoomResponse> findAvailable(Long hotelId, LocalDate checkIn, LocalDate checkOut);
    void addImage(Long roomId, ImageRequest request);
    void delete(Long id);
}
