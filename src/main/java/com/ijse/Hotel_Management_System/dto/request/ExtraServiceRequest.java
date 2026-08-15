package com.ijse.Hotel_Management_System.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ExtraServiceRequest(
        @NotNull Long hotelId,
        @NotBlank String name,
        String description,
        @NotNull BigDecimal price
) {}
