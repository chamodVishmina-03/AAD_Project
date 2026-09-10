package com.ijse.Hotel_Management_System.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class HotelImageResponse {
    private Long id;
    private String imageUrl;
    private String caption;
}