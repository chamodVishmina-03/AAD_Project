package com.ijse.Hotel_Management_System.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record HotelRequest(
        @NotBlank String name,
        String description,
        @NotBlank String address,
        @NotNull Long cityId,
        Double starRating,
        String phone,
        String email
) {}