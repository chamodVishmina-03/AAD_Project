package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.HotelRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.ImageRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.HotelResponse;

import java.util.List;

public interface HotelService {
    HotelResponse create(HotelRequest request);
    HotelResponse update(Long id, HotelRequest request);
    HotelResponse findById(Long id);
    List<HotelResponse> findAll();
    List<HotelResponse> search(String name, Long cityId);
    void addImage(Long hotelId, ImageRequest request);
    void delete(Long id);
}
