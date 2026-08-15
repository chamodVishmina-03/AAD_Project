package com.ijse.Hotel_Management_System.service.impl;

import com.ijse.Hotel_Management_System.dto.response.InvoiceResponse;
import com.ijse.Hotel_Management_System.entity.Invoice;
import com.ijse.Hotel_Management_System.exception.ResourceNotFoundException;
import com.ijse.Hotel_Management_System.repository.InvoiceRepository;
import com.ijse.Hotel_Management_System.service.InvoiceService;
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
