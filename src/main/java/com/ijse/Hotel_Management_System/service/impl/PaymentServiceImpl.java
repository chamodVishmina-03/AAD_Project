package com.ijse.Hotel_Management_System.service.impl;

import com.ijse.Hotel_Management_System.dto.request.PaymentRequest;
import com.ijse.Hotel_Management_System.dto.response.PaymentResponse;
import com.ijse.Hotel_Management_System.entity.Booking;
import com.ijse.Hotel_Management_System.entity.Invoice;
import com.ijse.Hotel_Management_System.entity.Payment;
import com.ijse.Hotel_Management_System.entity.User;
import com.ijse.Hotel_Management_System.enumeration.BookingStatus;
import com.ijse.Hotel_Management_System.enumeration.PaymentStatus;
import com.ijse.Hotel_Management_System.exception.BadRequestException;
import com.ijse.Hotel_Management_System.exception.ResourceNotFoundException;
import com.ijse.Hotel_Management_System.repository.BookingRepository;
import com.ijse.Hotel_Management_System.repository.InvoiceRepository;
import com.ijse.Hotel_Management_System.repository.PaymentRepository;
import com.ijse.Hotel_Management_System.repository.UserRepository;
import com.ijse.Hotel_Management_System.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentServiceImpl implements PaymentService {

    private static final BigDecimal TAX_RATE = new BigDecimal("0.10"); // 10% flat tax, for demonstration

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public PaymentResponse pay(String requesterEmail, PaymentRequest request) {
        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + request.bookingId()));

        User requester = userRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requesterEmail));

        if (!booking.getUser().getId().equals(requester.getId())) {
            throw new BadRequestException("You can only pay for your own bookings");
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only PENDING bookings can be paid for");
        }
        if (paymentRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new BadRequestException("This booking has already been paid for");
        }

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(booking.getTotalAmount())
                .method(request.method())
                .status(PaymentStatus.SUCCESS)
                .transactionId(UUID.randomUUID().toString())
                .paidAt(LocalDateTime.now())
                .build();
        payment = paymentRepository.save(payment);

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        generateInvoice(booking);

        log.info("Payment successful for booking id={} amount={} txn={}", booking.getId(),
                payment.getAmount(), payment.getTransactionId());

        return toResponse(payment);
    }

    @Override
    public PaymentResponse findByBooking(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("No payment found for booking id: " + bookingId));
    }

    private void generateInvoice(Booking booking) {
        BigDecimal subTotal = booking.getTotalAmount();
        BigDecimal tax = subTotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subTotal.add(tax);

        Invoice invoice = Invoice.builder()
                .booking(booking)
                .invoiceNumber("INV-" + booking.getId() + "-" + System.currentTimeMillis())
                .subTotal(subTotal)
                .taxAmount(tax)
                .totalAmount(total)
                .build();
        invoiceRepository.save(invoice);
    }

    private PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .bookingId(payment.getBooking().getId())
                .amount(payment.getAmount())
                .method(payment.getMethod())
                .status(payment.getStatus())
                .transactionId(payment.getTransactionId())
                .paidAt(payment.getPaidAt())
                .build();
    }
}
