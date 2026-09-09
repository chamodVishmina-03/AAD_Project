package com.ijse.Hotel_Management_System.controller;

import com.ijse.Hotel_Management_System.constant.CommonResponse;
import com.ijse.Hotel_Management_System.dto.request.ExtraServiceRequest;
import com.ijse.Hotel_Management_System.dto.response.ExtraServiceResponse;
import com.ijse.Hotel_Management_System.service.ExtraServiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.ijse.Hotel_Management_System.constant.ResponseCode.OPERATION_SUCCESS;
import static com.ijse.Hotel_Management_System.constant.ResponseMessage.SUCCESS_MESSAGE;

@RestController
@RequestMapping("/api/extra-services")
@RequiredArgsConstructor
public class ExtraServiceController {

    private final ExtraServiceService extraServiceService;


    @GetMapping("/hotel/{hotelId}")
    public CommonResponse findByHotel(@PathVariable Long hotelId) {
        List<ExtraServiceResponse> services = extraServiceService.findByHotel(hotelId);
        return new CommonResponse(OPERATION_SUCCESS, services, SUCCESS_MESSAGE);
    }

    @GetMapping("/{id}")
    public CommonResponse findById(@PathVariable Long id) {
        ExtraServiceResponse service = extraServiceService.findById(id);
        return new CommonResponse(OPERATION_SUCCESS, service, SUCCESS_MESSAGE);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public CommonResponse create(@Valid @RequestBody ExtraServiceRequest request) {
        ExtraServiceResponse service = extraServiceService.create(request);
        return new CommonResponse(OPERATION_SUCCESS, service, SUCCESS_MESSAGE);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public CommonResponse update(@PathVariable Long id, @Valid @RequestBody ExtraServiceRequest request) {
        ExtraServiceResponse service = extraServiceService.update(id, request);
        return new CommonResponse(OPERATION_SUCCESS, service, SUCCESS_MESSAGE);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public CommonResponse delete(@PathVariable Long id) {
        extraServiceService.delete(id);
        return new CommonResponse(SUCCESS_MESSAGE, OPERATION_SUCCESS);
    }
}



