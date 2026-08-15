package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.request.ExtraServiceRequest;
import com.ijse.Hotel_Management_System.entity.ExtraService;

import java.util.List;

public interface ExtraServiceService {
    ExtraService create(ExtraServiceRequest request);
    ExtraService update(Long id, ExtraServiceRequest request);
    List<ExtraService> findByHotel(Long hotelId);
    ExtraService findById(Long id);
    void delete(Long id);
}
