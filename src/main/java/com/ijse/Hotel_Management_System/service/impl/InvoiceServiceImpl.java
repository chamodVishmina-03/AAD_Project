package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.impl;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.InvoiceResponse;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.Invoice;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.exception.ResourceNotFoundException;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.InvoiceRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;

    @Override
    public InvoiceResponse findByBooking(Long bookingId) {
        Invoice invoice = invoiceRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("No invoice found for booking id: " + bookingId));
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .bookingId(bookingId)
                .invoiceNumber(invoice.getInvoiceNumber())
                .issuedDate(invoice.getIssuedDate())
                .subTotal(invoice.getSubTotal())
                .taxAmount(invoice.getTaxAmount())
                .totalAmount(invoice.getTotalAmount())
                .build();
    }
}
