package com.ijse.Hotel_Management_System.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;

public record BookingRequest(
        @NotNull Long roomId,
        @FutureOrPresent @NotNull LocalDate checkInDate,
        @Future @NotNull LocalDate checkOutDate,
        @NotNull @Positive Integer numberOfGuests,
        String couponCode,
        List<ExtraServiceLine> extraServices
) {
    public record ExtraServiceLine(@NotNull Long extraServiceId, @NotNull @Positive Integer quantity) {}
}
