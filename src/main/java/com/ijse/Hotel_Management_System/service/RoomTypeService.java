package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.request.RoomTypeRequest;
import com.ijse.Hotel_Management_System.entity.RoomType;

import java.util.List;

public interface RoomTypeService {
    RoomType create(RoomTypeRequest request);
    RoomType update(Long id, RoomTypeRequest request);
    List<RoomType> findAll();
    RoomType findById(Long id);
    void delete(Long id);
}
