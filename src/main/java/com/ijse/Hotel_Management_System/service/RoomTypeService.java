package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.RoomTypeRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.RoomType;

import java.util.List;

public interface RoomTypeService {
    RoomType create(RoomTypeRequest request);
    RoomType update(Long id, RoomTypeRequest request);
    List<RoomType> findAll();
    RoomType findById(Long id);
    void delete(Long id);
}
