package com.ijse.Hotel_Management_System.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class ExtraServiceResponse {
    private Long id;
    private Long hotelId;
    private String hotelName;
    private String name;
    private String description;
    private BigDecimal price;
}