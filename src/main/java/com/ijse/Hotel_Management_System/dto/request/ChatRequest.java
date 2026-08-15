package com.ijse.Hotel_Management_System.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequest(
        @NotBlank @Size(max = 1000, message = "Keep messages under 1000 characters") String message
) {}
