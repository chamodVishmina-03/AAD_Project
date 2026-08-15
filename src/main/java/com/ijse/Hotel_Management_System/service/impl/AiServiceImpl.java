package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.impl;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.ai.AiClient;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.ChatResponse;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.ReviewSummaryResponse;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.Hotel;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.Review;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.exception.ResourceNotFoundException;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.HotelRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.ReviewRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Two bonus-mark AI features (see coursework brief section 5.4):
 *  1) summarizeHotelReviews — condenses a hotel's guest reviews into a short blurb.
 *  2) chat — a lightweight "concierge" assistant grounded on the current hotel catalogue.
 *
 * Both are intentionally simple (single-turn, no persisted conversation, no tool-calling
 * loop) to keep the integration reliable and easy to demo — see README for the trade-offs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiServiceImpl implements AiService {

    private static final String REVIEW_SUMMARY_SYSTEM_PROMPT =
            "You are a concise, neutral review summarizer for a hotel booking platform called Havenstay. " +
            "Given a hotel's guest reviews, write a 2-3 sentence summary in plain English covering the " +
            "common positive and negative themes. Do not invent details that are not present in the reviews. " +
            "Do not use markdown formatting.";

    private static final String CONCIERGE_SYSTEM_PROMPT_PREFIX =
            "You are Concierge, the friendly booking assistant for a hotel platform called Havenstay. " +
            "Only recommend hotels from the catalogue provided below - never invent a hotel that isn't listed. " +
            "You do not have access to live prices or availability, so if asked about those, tell the guest " +
            "to open the hotel's page and use the date search there. Keep replies under 120 words and do not " +
            "use markdown formatting.\n\nCurrent hotel catalogue:\n";

    private final AiClient aiClient;
    private final HotelRepository hotelRepository;
    private final ReviewRepository reviewRepository;

    private final ConcurrentHashMap<Long, String> reviewSummaryCache = new ConcurrentHashMap<>();

    @Override
    public ReviewSummaryResponse summarizeHotelReviews(Long hotelId, boolean forceRegenerate) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + hotelId));

        List<Review> reviews = reviewRepository.findByHotelId(hotelId);

        if (reviews.isEmpty()) {
            return ReviewSummaryResponse.builder()
                    .hotelId(hotelId)
                    .summary("No reviews yet for this hotel.")
                    .reviewCount(0)
                    .cached(false)
                    .build();
        }

        if (!forceRegenerate && reviewSummaryCache.containsKey(hotelId)) {
            return ReviewSummaryResponse.builder()
                    .hotelId(hotelId)
                    .summary(reviewSummaryCache.get(hotelId))
                    .reviewCount(reviews.size())
                    .cached(true)
                    .build();
        }

        String reviewLines = reviews.stream()
                .map(r -> "- " + r.getRating() + "/5: " + (r.getComment() == null || r.getComment().isBlank() ? "(no comment)" : r.getComment()))
                .collect(Collectors.joining("\n"));

        String userPrompt = "Hotel: " + hotel.getName() + "\nGuest reviews:\n" + reviewLines;

        String summary = aiClient.complete(REVIEW_SUMMARY_SYSTEM_PROMPT, userPrompt);
        reviewSummaryCache.put(hotelId, summary);
        log.info("Generated AI review summary for hotel id={} ({} reviews)", hotelId, reviews.size());

        return ReviewSummaryResponse.builder()
                .hotelId(hotelId)
                .summary(summary)
                .reviewCount(reviews.size())
                .cached(false)
                .build();
    }

    @Override
    public ChatResponse chat(String message) {
        List<Hotel> hotels = hotelRepository.findAll();
        String catalogue = hotels.isEmpty()
                ? "(no hotels are currently listed)"
                : hotels.stream()
                    .limit(25)
                    .map(h -> "- " + h.getName() + " (" + (h.getCity() != null ? h.getCity().getName() : "unknown city")
                            + "), rating " + (h.getStarRating() != null ? h.getStarRating() : "n/a") + "/5")
                    .collect(Collectors.joining("\n"));

        String systemPrompt = CONCIERGE_SYSTEM_PROMPT_PREFIX + catalogue;
        String reply = aiClient.complete(systemPrompt, message);
        log.info("Concierge chat reply generated ({} chars)", reply.length());

        return ChatResponse.builder().reply(reply).build();
    }
}
