package com.ijse.Hotel_Management_System.controller;

import com.ijse.Hotel_Management_System.dto.response.InvoiceResponse;
import com.ijse.Hotel_Management_System.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<InvoiceResponse> findByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(invoiceService.findByBooking(bookingId));
    }
}
