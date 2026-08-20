package com.ijse.Hotel_Management_System.controller;

import com.ijse.Hotel_Management_System.constant.CommonResponse;
import com.ijse.Hotel_Management_System.dto.request.AmenityRequest;
import com.ijse.Hotel_Management_System.entity.Amenity;
import com.ijse.Hotel_Management_System.service.AmenityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
        amenityService.findAll();
        return new CommonResponse(SUCCESS_MESSAGE,OPERATION_SUCCESS);
    }


    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public CommonResponse create(@Valid @RequestBody AmenityRequest request) {
        amenityService.create(request);
        return new CommonResponse(SUCCESS_MESSAGE,OPERATION_SUCCESS);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public CommonResponse update(@PathVariable Long id, @Valid @RequestBody AmenityRequest request) {
        amenityService.update(id,request);
        return new CommonResponse(SUCCESS_MESSAGE,OPERATION_SUCCESS);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CommonResponse delete(@PathVariable Long id) {
        amenityService.delete(id);
        return  new CommonResponse(SUCCESS_MESSAGE,OPERATION_SUCCESS);
    }
}
