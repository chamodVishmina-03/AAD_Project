package com.ijse.Hotel_Management_System.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class HotelResponse {
    private Long id;
    private String name;
    private String description;
    private String address;
    private String cityName;
    private String country;
    private Double starRating;
    private String phone;
    private String email;
    private boolean active;
    private List<String> imageUrls;
}