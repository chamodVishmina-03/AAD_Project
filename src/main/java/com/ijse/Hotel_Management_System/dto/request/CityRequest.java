package com.ijse.Hotel_Management_System.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CityRequest(@NotBlank String name, @NotBlank String country) {}
