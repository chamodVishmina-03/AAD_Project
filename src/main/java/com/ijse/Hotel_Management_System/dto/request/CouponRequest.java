package com.ijse.Hotel_Management_System.dto.request;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.enumeration.DiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CouponRequest(
        @NotBlank String code,
        @NotNull DiscountType discountType,
        @NotNull BigDecimal discountValue,
        BigDecimal minBookingAmount,
        LocalDate expiryDate
) {}