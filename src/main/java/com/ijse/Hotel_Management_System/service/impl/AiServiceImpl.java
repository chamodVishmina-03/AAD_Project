package com.ijse.Hotel_Management_System.service.impl;

import com.ijse.Hotel_Management_System.ai.ChatClient;
import com.ijse.Hotel_Management_System.dto.response.ChatResponse;
import com.ijse.Hotel_Management_System.dto.response.ReviewSummaryResponse;
import com.ijse.Hotel_Management_System.entity.Hotel;
import com.ijse.Hotel_Management_System.entity.Review;
import com.ijse.Hotel_Management_System.exception.ResourceNotFoundException;
import com.ijse.Hotel_Management_System.repository.HotelRepository;
import com.ijse.Hotel_Management_System.repository.ReviewRepository;
import com.ijse.Hotel_Management_System.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;


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

    private final ChatClient aiClient;
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
        String reply = buildRuleBasedReply(message);
        log.info("Concierge chat reply generated ({} chars) via rule-based engine", reply.length());
        return ChatResponse.builder().reply(reply).build();
    }

    private String buildRuleBasedReply(String message) {
        String msg = message == null ? "" : message.toLowerCase();

        if (containsAny(msg, "hi", "hello", "hey")) {
            return "Hello! I'm Concierge. Ask me about our hotels, rooms, prices, or how to make a booking.";

        } else if (containsAny(msg, "bye", "goodbye", "see you")) {
            return "Goodbye! Have a great stay with Just Click.";

        } else if (containsAny(msg, "thank", "thanks")) {
            return "You're welcome! Let me know if you need anything else.";

        } else if (containsAny(msg, "hotel", "hotels")) {
            List<Hotel> hotels = hotelRepository.findAll();
            if (hotels.isEmpty()) {
                return "We don't have any hotels listed right now — please check back later.";
            }
            String names = hotels.stream()
                    .limit(5)
                    .map(Hotel::getName)
                    .collect(Collectors.joining(", "));
            return "Here are some of our hotels: " + names + ". Open a hotel's page to see its rooms and availability.";

        } else if (containsAny(msg, "price", "cost", "how much", "rate")) {
            return "Room prices vary by hotel and room type. Open a hotel's page and check its room list to see the price per night.";

        } else if (containsAny(msg, "book", "booking", "reserve")) {
            return "To book a room: open a hotel's page, pick your check-in/check-out dates, click \"Check availability\", then choose a room to reserve it.";

        } else if (containsAny(msg, "cancel")) {
            return "You can cancel a booking from the \"My bookings\" page as long as it's still pending or confirmed.";

        } else if (containsAny(msg, "room", "rooms")) {
            return "Each hotel lists its rooms with room type, floor, price per night and amenities on the hotel's page.";

        } else if (containsAny(msg, "review", "rating")) {
            return "You can read guest reviews at the bottom of every hotel's page, and leave your own after checking availability there.";

        } else if (containsAny(msg, "contact", "phone", "email", "support")) {
            return "Each hotel's page lists its address, phone number and email under the \"About\" section.";

        } else {
            return "Sorry, I didn't quite get that. You can ask me about hotels, rooms, prices, bookings, or reviews.";
        }
    }

    private boolean containsAny(String message, String... keywords) {
        for (String keyword : keywords) {
            if (message.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}