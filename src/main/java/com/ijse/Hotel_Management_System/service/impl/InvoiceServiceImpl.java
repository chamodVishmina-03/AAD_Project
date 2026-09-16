package com.ijse.Hotel_Management_System.service.impl;

import com.ijse.Hotel_Management_System.dto.response.InvoiceResponse;
import com.ijse.Hotel_Management_System.entity.Booking;
import com.ijse.Hotel_Management_System.entity.Invoice;
import com.ijse.Hotel_Management_System.entity.Room;
import com.ijse.Hotel_Management_System.entity.User;
import com.ijse.Hotel_Management_System.exception.ResourceNotFoundException;
import com.ijse.Hotel_Management_System.repository.InvoiceRepository;
import com.ijse.Hotel_Management_System.service.InvoiceService;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 22, Font.BOLD, new Color(30, 41, 59));
    private static final Font HEADING_FONT = new Font(Font.HELVETICA, 12, Font.BOLD, new Color(30, 41, 59));
    private static final Font NORMAL_FONT = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);
    private static final Font TABLE_HEADER_FONT = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
    private static final Font TOTAL_FONT = new Font(Font.HELVETICA, 12, Font.BOLD, new Color(30, 41, 59));

    @Override
    public InvoiceResponse findByBooking(Long bookingId) {
        Invoice invoice = getInvoiceOrThrow(bookingId);
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

    @Override
    public byte[] generateInvoicePdf(Long bookingId) {
        Invoice invoice = getInvoiceOrThrow(bookingId);
        Booking booking = invoice.getBooking();
        Room room = booking.getRoom();
        User user = booking.getUser();

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 40, 40, 50, 50);
            PdfWriter.getInstance(document, out);
            document.open();

            // ---- Header ----
            Paragraph title = new Paragraph("INVOICE", TITLE_FONT);
            document.add(title);

            Paragraph invoiceMeta = new Paragraph();
            invoiceMeta.add(new Chunk("Invoice No: " + invoice.getInvoiceNumber() + "\n", NORMAL_FONT));
            invoiceMeta.add(new Chunk("Issued Date: " + invoice.getIssuedDate().format(DATE_FMT) + "\n", NORMAL_FONT));
            invoiceMeta.setSpacingBefore(6f);
            invoiceMeta.setSpacingAfter(16f);
            document.add(invoiceMeta);

            // ---- Hotel / Guest info side by side ----
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(20f);

            PdfPCell hotelCell = new PdfPCell();
            hotelCell.setBorder(Rectangle.NO_BORDER);
            hotelCell.addElement(new Paragraph("Hotel", HEADING_FONT));
            hotelCell.addElement(new Paragraph(room.getHotel().getName(), NORMAL_FONT));
            hotelCell.addElement(new Paragraph(room.getHotel().getAddress(), NORMAL_FONT));
            infoTable.addCell(hotelCell);

            PdfPCell guestCell = new PdfPCell();
            guestCell.setBorder(Rectangle.NO_BORDER);
            guestCell.addElement(new Paragraph("Billed To", HEADING_FONT));
            guestCell.addElement(new Paragraph(user.getFullName(), NORMAL_FONT));
            guestCell.addElement(new Paragraph(user.getEmail(), NORMAL_FONT));
            infoTable.addCell(guestCell);

            document.add(infoTable);

            // ---- Booking details table ----
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 2f, 2f, 2f});
            table.setSpacingAfter(16f);

            addHeaderCell(table, "Description");
            addHeaderCell(table, "Check-in");
            addHeaderCell(table, "Check-out");
            addHeaderCell(table, "Amount");

            long nights = java.time.temporal.ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate());
            String description = "Room " + room.getRoomNumber() + " (" + room.getRoomType().getName() + ") x "
                    + nights + " night(s)";

            addBodyCell(table, description);
            addBodyCell(table, booking.getCheckInDate().format(DATE_FMT));
            addBodyCell(table, booking.getCheckOutDate().format(DATE_FMT));
            addBodyCell(table, money(invoice.getSubTotal()));

            document.add(table);

            // ---- Totals ----
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(50);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

            addTotalRow(totalsTable, "Sub Total", money(invoice.getSubTotal()), NORMAL_FONT);
            addTotalRow(totalsTable, "Tax", money(invoice.getTaxAmount()), NORMAL_FONT);
            addTotalRow(totalsTable, "Total", money(invoice.getTotalAmount()), TOTAL_FONT);

            document.add(totalsTable);

            // ---- Footer ----
            Paragraph footer = new Paragraph("\nThank you for booking with us!", NORMAL_FONT);
            footer.setSpacingBefore(30f);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();

            log.info("Generated PDF invoice for booking id={}", bookingId);
            return out.toByteArray();

        } catch (DocumentException e) {
            log.error("Failed to generate PDF invoice for booking id={}", bookingId, e);
            throw new IllegalStateException("Failed to generate invoice PDF", e);
        }
    }

    private Invoice getInvoiceOrThrow(Long bookingId) {
        return invoiceRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("No invoice found for booking id: " + bookingId));
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, TABLE_HEADER_FONT));
        cell.setBackgroundColor(new Color(30, 41, 59));
        cell.setPadding(8f);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, NORMAL_FONT));
        cell.setPadding(8f);
        table.addCell(cell);
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(4f);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(4f);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(valueCell);
    }

    private String money(BigDecimal amount) {
        return "LKR " + amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
    }
}