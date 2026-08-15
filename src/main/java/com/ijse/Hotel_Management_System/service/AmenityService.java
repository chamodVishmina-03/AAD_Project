package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.AmenityRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.Amenity;

import java.util.List;

public interface AmenityService {
    Amenity create(AmenityRequest request);
    Amenity update(Long id, AmenityRequest request);
    List<Amenity> findAll();
    Amenity findById(Long id);
    void delete(Long id);
}
