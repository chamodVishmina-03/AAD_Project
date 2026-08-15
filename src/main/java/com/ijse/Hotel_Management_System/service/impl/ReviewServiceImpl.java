package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.impl;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.ReviewRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.ReviewResponse;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.Hotel;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.Review;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.User;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.exception.BadRequestException;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.exception.ResourceNotFoundException;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.HotelRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.ReviewRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.UserRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final HotelRepository hotelRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReviewResponse create(String requesterEmail, ReviewRequest request) {
        User user = userRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requesterEmail));
        Hotel hotel = hotelRepository.findById(request.hotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + request.hotelId()));

        Review review = Review.builder()
                .user(user)
                .hotel(hotel)
                .rating(request.rating())
                .comment(request.comment())
                .build();

        review = reviewRepository.save(review);
        log.info("Review created id={} hotel={} rating={}", review.getId(), hotel.getName(), review.getRating());
        return toResponse(review);
    }

    @Override
    public List<ReviewResponse> findByHotel(Long hotelId) {
        return reviewRepository.findByHotelId(hotelId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(String requesterEmail, Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
        User requester = userRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requesterEmail));

        boolean isOwner = review.getUser().getId().equals(requester.getId());
        boolean isPrivileged = requester.getRoles().stream()
                .anyMatch(r -> r.name().equals("ADMIN") || r.name().equals("STAFF"));

        if (!isOwner && !isPrivileged) {
            throw new BadRequestException("You can only delete your own reviews");
        }
        reviewRepository.delete(review);
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .hotelId(review.getHotel().getId())
                .hotelName(review.getHotel().getName())
                .reviewerName(review.getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
