package com.ijse.Hotel_Management_System.ai;

import com.ijse.Hotel_Management_System.ai.AiClient;
import com.ijse.Hotel_Management_System.dto.response.ChatResponse;
import com.ijse.Hotel_Management_System.dto.response.ReviewSummaryResponse;
import com.ijse.Hotel_Management_System.entity.Hotel;
import com.ijse.Hotel_Management_System.entity.Review;
import com.ijse.Hotel_Management_System.entity.Room;
import com.ijse.Hotel_Management_System.enumeration.RoomStatus;
import com.ijse.Hotel_Management_System.exception.ResourceNotFoundException;
import com.ijse.Hotel_Management_System.repository.HotelRepository;
import com.ijse.Hotel_Management_System.repository.ReviewRepository;
import com.ijse.Hotel_Management_System.repository.RoomRepository;
import com.ijse.Hotel_Management_System.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
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

    private final AiClient aiClient;
    private final HotelRepository hotelRepository;
    private final ReviewRepository reviewRepository;
    private final RoomRepository roomRepository;

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
        log.info("Rule-based chat reply generated ({} chars)", reply.length());
        return ChatResponse.builder().reply(reply).build();
    }

    private String buildRuleBasedReply(String rawMessage) {
        String msg = rawMessage == null ? "" : rawMessage.toLowerCase();

        if (msg.contains("check-in") || msg.contains("check in") || msg.contains("checkin")) {
            return "Check-in is from 2:00 PM at every Ceylon Collection property. Early check-in is possible if a room is ready.";
        }

        if (msg.contains("check-out") || msg.contains("check out") || msg.contains("checkout")) {
            return "Check-out is by 11:00 AM. Late check-out until 1:00 PM is free for Suite guests.";
        }

        if (msg.contains("price") || msg.contains("rate") || msg.contains("cost") || msg.contains("how much")) {
            List<Room> rooms = roomRepository.findAll();
            if (rooms.isEmpty()) {
                return "We don't have any rooms listed yet — please check back soon.";
            }
            BigDecimal min = rooms.stream().map(Room::getPricePerNight).min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
            BigDecimal max = rooms.stream().map(Room::getPricePerNight).max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
            return "Rates currently range from " + formatLkr(min) + " to " + formatLkr(max)
                    + " per night, depending on the hotel and room type.";
        }

        if (msg.contains("wifi") || msg.contains("wi-fi") || msg.contains("internet")) {
            return "Yes — free high-speed Wi-Fi is included in every room across all our hotels.";
        }

        if (msg.contains("which hotel") || msg.contains("hotels do you") || msg.contains("list of hotel") || msg.contains("locations")) {
            List<Hotel> hotels = hotelRepository.findAll();
            if (hotels.isEmpty()) {
                return "We don't have any hotels listed yet.";
            }
            String list = hotels.stream()
                    .limit(10)
                    .map(h -> h.getName() + " (" + (h.getCity() != null ? h.getCity().getName() : "unknown city") + ")")
                    .collect(Collectors.joining(", "));
            return "We manage " + hotels.size() + " " + (hotels.size() == 1 ? "property" : "properties") + ": " + list + ".";
        }

        if (msg.contains("available") || msg.contains("vacant") || (msg.contains("room") && msg.contains("free"))) {
            long free = roomRepository.findAll().stream()
                    .filter(r -> r.getStatus() == RoomStatus.AVAILABLE)
                    .count();
            return free + " rooms are marked AVAILABLE across all properties right now.";
        }

        if (msg.contains("address") || msg.contains("where") || msg.contains("location")) {
            return "Our head office is at 12 Galle Face Terrace, Colombo 03. Open a specific hotel's page to see its own address.";
        }

        if (msg.contains("phone") || msg.contains("contact") || msg.contains("number")) {
            return "Head office reservations: +94 11 234 5678, reservations@ceyloncollection.lk.";
        }

        if (msg.contains("hi") || msg.contains("hello") || msg.contains("ayubowan")) {
            return "Ayubowan! How can I help — check-in time, room prices, Wi-Fi, or our hotel locations?";
        }

        if (msg.contains("thank")) {
            return "You're most welcome! Anything else I can help with?";
        }

        return "I didn't quite catch that. I can help with: check-in/check-out time, room prices, Wi-Fi, hotel locations, or contact details.";
    }

    private String formatLkr(BigDecimal amount) {
        NumberFormat formatter = NumberFormat.getIntegerInstance(Locale.US);
        return "LKR " + formatter.format(amount);
    }
}