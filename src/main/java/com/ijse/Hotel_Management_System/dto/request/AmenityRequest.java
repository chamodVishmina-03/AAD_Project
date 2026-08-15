package com.ijse.Hotel_Management_System.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AmenityRequest(@NotBlank String name, String description, String icon) {}
