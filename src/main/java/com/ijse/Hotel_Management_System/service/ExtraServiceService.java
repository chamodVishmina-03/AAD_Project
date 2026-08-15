package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.ExtraServiceRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.ExtraService;

import java.util.List;

public interface ExtraServiceService {
    ExtraService create(ExtraServiceRequest request);
    ExtraService update(Long id, ExtraServiceRequest request);
    List<ExtraService> findByHotel(Long hotelId);
    ExtraService findById(Long id);
    void delete(Long id);
}
