package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.request.AmenityRequest;
import com.ijse.Hotel_Management_System.entity.Amenity;

import java.util.List;

public interface AmenityService {
    Amenity create(AmenityRequest request);
    Amenity update(Long id, AmenityRequest request);
    List<Amenity> findAll();
    Amenity findById(Long id);
    void delete(Long id);
}
