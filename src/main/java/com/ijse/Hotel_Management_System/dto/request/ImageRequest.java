package com.ijse.Hotel_Management_System.dto.request;
import jakarta.validation.constraints.NotBlank;

public record ImageRequest(@NotBlank String imageUrl, String caption) {}
