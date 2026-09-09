package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.request.ExtraServiceRequest;
import com.ijse.Hotel_Management_System.dto.response.ExtraServiceResponse;

import java.util.List;

public interface ExtraServiceService {
    ExtraServiceResponse create(ExtraServiceRequest request);
    ExtraServiceResponse update(Long id, ExtraServiceRequest request);
    List<ExtraServiceResponse> findByHotel(Long hotelId);
    ExtraServiceResponse findById(Long id);
    void delete(Long id);
}