package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.request.HotelRequest;
import com.ijse.Hotel_Management_System.dto.request.ImageRequest;
import com.ijse.Hotel_Management_System.dto.response.HotelResponse;

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
