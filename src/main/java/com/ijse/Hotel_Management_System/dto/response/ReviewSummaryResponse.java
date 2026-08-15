package com.ijse.Hotel_Management_System.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ReviewSummaryResponse {
    private Long hotelId;
    private String summary;
    private int reviewCount;
    private boolean cached;
}
