package com.ijse.Hotel_Management_System.controller;

import com.ijse.Hotel_Management_System.dto.response.InvoiceResponse;
import com.ijse.Hotel_Management_System.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    @GetMapping("/booking/{bookingId}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long bookingId) {
        byte[] pdfBytes = invoiceService.generateInvoicePdf(bookingId);

        ContentDisposition contentDisposition = ContentDisposition.attachment()
                .filename("invoice-" + bookingId + ".pdf")
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(contentDisposition);
        headers.setContentType(MediaType.APPLICATION_PDF);

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(pdfBytes.length)
                .body(pdfBytes);
    }
}