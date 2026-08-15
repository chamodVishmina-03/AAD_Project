package com.ijse.Hotel_Management_System.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.Set;

public record RoomRequest(
        @NotNull Long hotelId,
        @NotNull Long roomTypeId,
        @NotBlank String roomNumber,
        Integer floorNo,
        @NotNull @Positive BigDecimal pricePerNight,
        Set<Long> amenityIds
) {}