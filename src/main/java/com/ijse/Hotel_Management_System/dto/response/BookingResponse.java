package com.ijse.Hotel_Management_System.dto.response;
import com.ijse.Hotel_Management_System.enumeration.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private Long userId;
    private String guestName;
    private Long roomId;
    private String roomNumber;
    private String hotelName;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer numberOfGuests;
    private BookingStatus status;
    private BigDecimal totalAmount;
    private List<String> extraServices;
}