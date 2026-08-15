package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.request.CityRequest;
import com.ijse.Hotel_Management_System.entity.City;

import java.util.List;

public interface CityService {
    City create(CityRequest request);
    City update(Long id, CityRequest request);
    List<City> findAll();
    City findById(Long id);
    void delete(Long id);
}
