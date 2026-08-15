package com.ijse.Hotel_Management_System.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RoomTypeRequest(@NotBlank String name, String description, Integer maxOccupancy) {}
