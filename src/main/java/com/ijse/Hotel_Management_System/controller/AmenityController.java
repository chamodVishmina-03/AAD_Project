package com.ijse.Hotel_Management_System.controller;

import com.ijse.Hotel_Management_System.constant.CommonResponse;
import com.ijse.Hotel_Management_System.dto.request.AmenityRequest;
import com.ijse.Hotel_Management_System.entity.Amenity;
import com.ijse.Hotel_Management_System.service.AmenityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.ijse.Hotel_Management_System.constant.ResponseCode.OPERATION_SUCCESS;
import static com.ijse.Hotel_Management_System.constant.ResponseMessage.SUCCESS_MESSAGE;

@RestController
@RequestMapping("/api/amenities")
@RequiredArgsConstructor
public class AmenityController {

    private final AmenityService amenityService;

    @GetMapping
    public CommonResponse findAll() {
        List<Amenity> amenities = amenityService.findAll();
        return new CommonResponse(OPERATION_SUCCESS, amenities, SUCCESS_MESSAGE);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public CommonResponse create(@Valid @RequestBody AmenityRequest request) {
        Amenity amenity = amenityService.create(request);
        return new CommonResponse(OPERATION_SUCCESS, amenity, SUCCESS_MESSAGE);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public CommonResponse update(@PathVariable Long id, @Valid @RequestBody AmenityRequest request) {
        Amenity amenity = amenityService.update(id, request);
        return new CommonResponse(OPERATION_SUCCESS, amenity, SUCCESS_MESSAGE);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CommonResponse delete(@PathVariable Long id) {
        amenityService.delete(id);
        return new CommonResponse(SUCCESS_MESSAGE, OPERATION_SUCCESS);
    }
}