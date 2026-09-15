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


    // call to API
    private final ChatClient aiClient;
    private final HotelRepository hotelRepository;
    private final ReviewRepository reviewRepository;



    // store cache summery made by ai
    private final ConcurrentHashMap<Long, String> reviewSummaryCache = new ConcurrentHashMap<>();



    @Override
    public ReviewSummaryResponse summarizeHotelReviews(Long hotelId, boolean forceRegenerate) {

        // get hotels and reviews from db
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("   Hotel not found with id:  " + hotelId));
        List<Review> reviews = reviewRepository.findByHotelId(hotelId);

        if (reviews.isEmpty()) {
            return buildResponse(hotelId, "  No reviews yet for this hotel.  ", 0, false);
        }




        // check cache is it has a summery
        if (!forceRegenerate && reviewSummaryCache.containsKey(hotelId)) {
            return buildResponse(hotelId, reviewSummaryCache.get(hotelId), reviews.size(), true);
        }




        // reviews convert to prompt
        String userPrompt = buildReviewPrompt(hotel, reviews);




        // call to AI and give summery
        String summary = aiClient.complete(REVIEW_SUMMARY_SYSTEM_PROMPT, userPrompt);
        log.info("    Generated AI review summary for hotel id={} ({} reviews)  ", hotelId, reviews.size());




        // return store in cache and it summery give to user
        reviewSummaryCache.put(hotelId, summary);
        return buildResponse(hotelId, summary, reviews.size(), false);
    }



    // reviews convert to promt
    private String buildReviewPrompt(Hotel hotel, List<Review> reviews) {
        String reviewLines = reviews.stream()
                .map(r -> "- " + r.getRating() + "/5: " +
                        (r.getComment() == null || r.getComment().isBlank() ? " (no comment) " : r.getComment()))
                .collect(Collectors.joining("\n"));
        return " Hotel: " + hotel.getName() + "\n Guest reviews: \n" + reviewLines;
    }




    // build response
    private ReviewSummaryResponse buildResponse(Long hotelId, String summary, int count, boolean cached) {
        return ReviewSummaryResponse.builder()
                .hotelId(hotelId)
                .summary(summary)
                .reviewCount(count)
                .cached(cached)
                .build();
    }







    @Override
    public ChatResponse chat(String message) {

        String reply = buildRuleBasedReply(message);
        return ChatResponse.builder().reply(reply).build();

    }

    private String buildRuleBasedReply(String rawMessage) {

        String msg = rawMessage == null ? "" : rawMessage.toLowerCase();

        if (containsAny(msg, "hi", "hello", "hey")) {
            return "Hello! How can I help you with booking a hotel or room today?";
        }
        if (containsAny(msg, "hotels")) {
            return listHotelNames();
        }
        if (containsAny(msg, "book", "reserve")) {
            return "To book a room: open a hotel's page, pick your check-in/check-out dates," +
                    " click \"Check availability\", then choose a room to reserve it.";
        }

        return "Sorry, I didn't quite get that. You can ask me about hotels, rooms, prices, bookings, or reviews.";

    }


    private String listHotelNames() {

        List<Hotel> hotels = hotelRepository.findAll();

        if (hotels.isEmpty())
            return "We don't have any hotels listed right now.";
        String names = hotels.stream().limit(5).map(Hotel::getName).collect(Collectors.joining(", "));
        return "Here are some of our hotels: " + names + ".";


    }

    private boolean containsAny(String message, String... keywords) {

        for (String keyword : keywords) {
            if (message.contains(keyword)) return true;
        }
        return false;
    }

}