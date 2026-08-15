package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.CityRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.City;

import java.util.List;

public interface CityService {
    City create(CityRequest request);
    City update(Long id, CityRequest request);
    List<City> findAll();
    City findById(Long id);
    void delete(Long id);
}
