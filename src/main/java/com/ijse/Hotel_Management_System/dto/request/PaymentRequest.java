package com.ijse.Hotel_Management_System.dto.request;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.enumeration.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record PaymentRequest(@NotNull Long bookingId, @NotNull PaymentMethod method) {}