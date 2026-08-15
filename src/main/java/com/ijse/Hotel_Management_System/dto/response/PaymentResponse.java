package com.ijse.Hotel_Management_System.dto.response;


import com.ijse.HOTEL_MANAGEMENT_SYSTEM.enumeration.PaymentMethod;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.enumeration.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private Long bookingId;
    private BigDecimal amount;
    private PaymentMethod method;
    private PaymentStatus status;
    private String transactionId;
    private LocalDateTime paidAt;
}