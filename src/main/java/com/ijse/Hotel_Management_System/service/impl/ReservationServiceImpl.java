package com.ijse.Hotel_Management_System.service.impl;

import com.ijse.Hotel_Management_System.dto.request.BookingRequest;
import com.ijse.Hotel_Management_System.dto.response.BookingResponse;
import com.ijse.Hotel_Management_System.entity.*;
import com.ijse.Hotel_Management_System.enumeration.BookingStatus;
import com.ijse.Hotel_Management_System.enumeration.DiscountType;
import com.ijse.Hotel_Management_System.exception.BadRequestException;
import com.ijse.Hotel_Management_System.exception.ResourceNotFoundException;
import com.ijse.Hotel_Management_System.exception.RoomNotAvailableException;
import com.ijse.Hotel_Management_System.repository.*;
import com.ijse.Hotel_Management_System.service.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReservationServiceImpl implements ReservationService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;
    private final ExtraServiceRepository extraServiceRepository;

    @Override
    @Transactional
    public BookingResponse createBooking(String requesterEmail, BookingRequest request) {
        if (!request.checkInDate().isBefore(request.checkOutDate())) {
            throw new BadRequestException("checkInDate must be before checkOutDate");
        }

        User user = userRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requesterEmail));

        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + request.roomId()));

        boolean overlapping = bookingRepository.existsOverlappingBooking(
                room.getId(), request.checkInDate(), request.checkOutDate());
        if (overlapping) {
            throw new RoomNotAvailableException("Room " + room.getRoomNumber() + " is not available for the selected dates");
        }

        long nights = ChronoUnit.DAYS.between(request.checkInDate(), request.checkOutDate());
        BigDecimal roomTotal = room.getPricePerNight().multiply(BigDecimal.valueOf(nights));

        Booking booking = Booking.builder()
                .user(user)
                .room(room)
                .checkInDate(request.checkInDate())
                .checkOutDate(request.checkOutDate())
                .numberOfGuests(request.numberOfGuests())
                .status(BookingStatus.PENDING)
                .totalAmount(roomTotal)
                .extraServices(new ArrayList<>())
                .build();

        BigDecimal extrasTotal = BigDecimal.ZERO;
        if (request.extraServices() != null) {
            for (BookingRequest.ExtraServiceLine line : request.extraServices()) {
                ExtraService extraService = extraServiceRepository.findById(line.extraServiceId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Extra service not found with id: " + line.extraServiceId()));
                BigDecimal lineTotal = extraService.getPrice().multiply(BigDecimal.valueOf(line.quantity()));
                extrasTotal = extrasTotal.add(lineTotal);

                BookingService bookingServiceLine = BookingService.builder()
                        .booking(booking)
                        .extraService(extraService)
                        .quantity(line.quantity())
                        .priceAtBooking(extraService.getPrice())
                        .build();
                booking.getExtraServices().add(bookingServiceLine);
            }
        }

        BigDecimal grandTotal = roomTotal.add(extrasTotal);

        if (request.couponCode() != null && !request.couponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(request.couponCode())
                    .orElseThrow(() -> new BadRequestException("Invalid coupon code: " + request.couponCode()));

            if (!coupon.isActive() || (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDate.now()))) {
                throw new BadRequestException("Coupon has expired or is no longer active");
            }
            if (coupon.getMinBookingAmount() != null && grandTotal.compareTo(coupon.getMinBookingAmount()) < 0) {
                throw new BadRequestException("Booking total does not meet the minimum amount for this coupon");
            }

            BigDecimal discount = coupon.getDiscountType() == DiscountType.PERCENTAGE
                    ? grandTotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100))
                    : coupon.getDiscountValue();

            grandTotal = grandTotal.subtract(discount).max(BigDecimal.ZERO);
            booking.setCoupon(coupon);
        }

        booking.setTotalAmount(grandTotal);
        booking = bookingRepository.save(booking);
        log.info("Created booking id={} for user={} room={} total={}", booking.getId(), user.getEmail(),
                room.getRoomNumber(), grandTotal);

        return toResponse(booking);
    }

    @Override
    public BookingResponse findById(Long id) {
        return toResponse(getBookingOrThrow(id));
    }

    @Override
    public List<BookingResponse> findByUser(Long userId) {
        return bookingRepository.findByUserId(userId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<BookingResponse> findAll() {
        return bookingRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponse updateStatus(Long id, BookingStatus status) {
        Booking booking = getBookingOrThrow(id);
        booking.setStatus(status);
        log.info("Booking id={} status changed to {}", id, status);
        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional
    public void cancel(String requesterEmail, Long id) {
        Booking booking = getBookingOrThrow(id);
        User requester = userRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requesterEmail));

        boolean isOwner = booking.getUser().getId().equals(requester.getId());
        boolean isPrivileged = requester.getRoles().stream()
                .anyMatch(r -> r.name().equals("ADMIN") || r.name().equals("STAFF"));

        if (!isOwner && !isPrivileged) {
            throw new BadRequestException("You can only cancel your own bookings");
        }
        if (booking.getStatus() == BookingStatus.CHECKED_OUT || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("A completed booking cannot be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        log.info("Booking id={} cancelled by {}", id, requesterEmail);
    }

    private Booking getBookingOrThrow(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    private BookingResponse toResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .guestName(booking.getUser().getFullName())
                .roomId(booking.getRoom().getId())
                .roomNumber(booking.getRoom().getRoomNumber())
                .hotelName(booking.getRoom().getHotel().getName())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .numberOfGuests(booking.getNumberOfGuests())
                .status(booking.getStatus())
                .totalAmount(booking.getTotalAmount())
                .extraServices(booking.getExtraServices().stream()
                        .map(bs -> bs.getExtraService().getName() + " x" + bs.getQuantity())
                        .collect(Collectors.toList()))
                .build();
    }
}
