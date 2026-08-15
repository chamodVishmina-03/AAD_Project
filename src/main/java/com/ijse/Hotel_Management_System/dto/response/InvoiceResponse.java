package com.ijse.Hotel_Management_System.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
@AllArgsConstructor
public class InvoiceResponse {
    private Long id;
    private Long bookingId;
    private String invoiceNumber;
    private LocalDate issuedDate;
    private BigDecimal subTotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
}
