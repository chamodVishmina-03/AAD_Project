package com.ijse.Hotel_Management_System.dto.response;
import com.ijse.Hotel_Management_System.enumeration.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Getter
@Builder
@AllArgsConstructor
public class RoomResponse {
    private Long id;
    private Long hotelId;
    private String hotelName;
    private String roomType;
    private String roomNumber;
    private Integer floorNo;
    private BigDecimal pricePerNight;
    private RoomStatus status;
    private Set<String> amenities;
    private List<String> imageUrls;
}
