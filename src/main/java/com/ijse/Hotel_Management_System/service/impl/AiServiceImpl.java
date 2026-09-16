package com.ijse.Hotel_Management_System.service.impl;

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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiServiceImpl implements AiService {

    private final HotelRepository hotelRepository;
    private final ReviewRepository reviewRepository;
    private final RoomRepository roomRepository;


    private static final Pattern NUMBER_PATTERN = Pattern.compile("\\d+");




    //================================= review Summery ========================================================
    @Override
    public ReviewSummaryResponse summarizeHotelReviews(Long hotelId, boolean forceRegenerate) {

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + hotelId));

        List<Review> reviews = reviewRepository.findByHotelId(hotelId);

        if (reviews.isEmpty()) {
            return buildResponse(hotelId, "No reviews yet for this hotel.", 0);
        }

        double average = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0);

        long positive = reviews.stream().filter(r -> r.getRating() >= 4).count();
        long neutral = reviews.stream().filter(r -> r.getRating() == 3).count();
        long negative = reviews.stream().filter(r -> r.getRating() <= 2).count();

        String verdict;
        if (average >= 4.5) {
            verdict = "Guests rate this hotel excellent.";
        } else if (average >= 3.5) {
            verdict = "Guests are generally happy with this hotel.";
        } else if (average >= 2.5) {
            verdict = "Guest opinions about this hotel are mixed.";
        } else {
            verdict = "Guests have reported several problems with this hotel.";
        }

        String summary = hotel.getName() + " has an average rating of "
                + String.format(Locale.US, "%.1f", average) + "/5 from "
                + reviews.size() + " review(s). "
                + positive + " positive, " + neutral + " neutral and "
                + negative + " negative. " + verdict;

        log.info("Built review summary for hotel id={} ({} reviews)", hotelId, reviews.size());

        return buildResponse(hotelId, summary, reviews.size());
    }


    private ReviewSummaryResponse buildResponse(Long hotelId, String summary, int count) {
        return ReviewSummaryResponse.builder()
                .hotelId(hotelId)
                .summary(summary)
                .reviewCount(count)
                .cached(false)
                .build();
    }





    // ============= chat box ====================================================================
    @Override
    public ChatResponse chat(String message) {
        String reply = buildRuleBasedReply(message);
        return ChatResponse.builder().reply(reply).build();
    }


    private String buildRuleBasedReply(String rawMessage) {

        String msg = rawMessage == null ? "" : rawMessage.toLowerCase().trim();

        if (msg.isBlank()) {
            return "Please type something. You can ask me about hotels, available rooms, prices, bookings or reviews.";
        }

        // greetings (whole-word match, so "this" / "which" won't trigger "hi")
        if (containsAnyWord(msg, "hi", "hello", "hey", "ayubowan")) {
            return "Hello! How can I help you with booking a hotel or room today?";
        }

        // REVIEW SUMMARY -> "review summary for hotel 3" / "reviews of Ocean View"
        if (containsAny(msg, "review", "reviews", "rating", "ratings")) {
            return reviewSummaryReply(msg);
        }

        // AVAILABLE ROOMS -> count + min price + max price
        if (containsAny(msg, "available room", "available rooms", "availability", "free room", "room available")) {
            return availableRoomsReply();
        }

        // "max" -> only the highest priced room
        if (containsAny(msg, "max", "expensive", "highest")) {
            return maxRoomReply();
        }

        // "min" -> only the lowest priced room
        if (containsAny(msg, "min", "cheapest", "lowest")) {
            return minRoomReply();
        }

        // general price question -> full range
        if (containsAny(msg, "price", "rate", "cost", "budget")) {
            return priceRangeReply();
        }

        // HOTELS -> hotel names + each hotel's min & max room price
        if (containsAny(msg, "hotel", "hotels")) {
            return hotelsReply();
        }

        // plain "rooms"
        if (containsAny(msg, "room", "rooms")) {
            return roomsReply();
        }

        // booking help
        if (containsAny(msg, "book", "reserve", "reservation")) {
            return "To book a room: open a hotel's page, pick your check-in/check-out dates," +
                    " click \"Check availability\", then choose a room to reserve it.";
        }

        return "Sorry, I didn't quite get that. You can ask me about hotels, available rooms, " +
                "prices, bookings, or reviews.";
    }




    // ---------------- reply builders ----------------

    private String reviewSummaryReply(String msg) {

        List<Hotel> hotels = hotelRepository.findAll();

        if (hotels.isEmpty()) {
            return "We don't have any hotels listed right now.";
        }

        // try to match a hotel by name mentioned in the message
        Optional<Hotel> byName = hotels.stream()
                .filter(h -> msg.contains(h.getName().toLowerCase()))
                .findFirst();

        if (byName.isPresent()) {
            ReviewSummaryResponse r = summarizeHotelReviews(byName.get().getId(), false);
            return r.getSummary();
        }

        // try to match a hotel by numeric id mentioned in the message
        Matcher matcher = NUMBER_PATTERN.matcher(msg);
        if (matcher.find()) {
            Long hotelId = Long.parseLong(matcher.group());
            try {
                ReviewSummaryResponse r = summarizeHotelReviews(hotelId, false);
                return r.getSummary();
            } catch (ResourceNotFoundException e) {
                return "I couldn't find a hotel with id " + hotelId + ". " + hotelNameHint(hotels);
            }
        }

        // no hotel mentioned at all
        return "Which hotel's reviews would you like to see? " + hotelNameHint(hotels);
    }

    private String hotelNameHint(List<Hotel> hotels) {
        String names = hotels.stream().limit(5).map(Hotel::getName)
                .reduce((a, b) -> a + ", " + b).orElse("");
        return "You can ask e.g. \"reviews of " + hotels.get(0).getName() +
                "\" or \"review summary for hotel " + hotels.get(0).getId() +
                "\". Our hotels: " + names + ".";
    }




    private String availableRoomsReply() {

        LocalDate checkIn = LocalDate.now();
        LocalDate checkOut = checkIn.plusDays(1);

        List<Room> availableRooms = new ArrayList<>();
        for (Hotel hotel : hotelRepository.findAll()) {
            availableRooms.addAll(roomRepository.findAvailableRooms(hotel.getId(), checkIn, checkOut));
        }

        if (availableRooms.isEmpty()) {
            return "Sorry, there are no available rooms tonight. Please try different dates.";
        }

        Room minRoom = availableRooms.stream()
                .min(Comparator.comparing(Room::getPricePerNight))
                .orElseThrow();

        Room maxRoom = availableRooms.stream()
                .max(Comparator.comparing(Room::getPricePerNight))
                .orElseThrow();

        return "We currently have " + availableRooms.size() + " available room(s).\n" +
                "Cheapest (min) : Room " + minRoom.getRoomNumber() +
                " at " + minRoom.getHotel().getName() +
                " - " + money(minRoom.getPricePerNight()) + " per night.\n" +
                "Highest (max)  : Room " + maxRoom.getRoomNumber() +
                " at " + maxRoom.getHotel().getName() +
                " - " + money(maxRoom.getPricePerNight()) + " per night.";
    }



    private String maxRoomReply() {

        List<Room> rooms = roomRepository.findAll();

        if (rooms.isEmpty()) {
            return "No rooms have been added yet.";
        }

        Room maxRoom = rooms.stream()
                .max(Comparator.comparing(Room::getPricePerNight))
                .orElseThrow();

        return "Highest priced room: Room " + maxRoom.getRoomNumber() +
                " at " + maxRoom.getHotel().getName() +
                " - " + money(maxRoom.getPricePerNight()) + " per night.";
    }



    private String minRoomReply() {

        List<Room> rooms = roomRepository.findAll();

        if (rooms.isEmpty()) {
            return "No rooms have been added yet.";
        }

        Room minRoom = rooms.stream()
                .min(Comparator.comparing(Room::getPricePerNight))
                .orElseThrow();

        return "Lowest priced room: Room " + minRoom.getRoomNumber() +
                " at " + minRoom.getHotel().getName() +
                " - " + money(minRoom.getPricePerNight()) + " per night.";
    }


    private String priceRangeReply() {

        List<Room> rooms = roomRepository.findAll();

        if (rooms.isEmpty()) {
            return "No rooms have been added yet, so I can't show you a price range.";
        }

        BigDecimal min = rooms.stream()
                .map(Room::getPricePerNight)
                .min(Comparator.naturalOrder())
                .orElseThrow();

        BigDecimal max = rooms.stream()
                .map(Room::getPricePerNight)
                .max(Comparator.naturalOrder())
                .orElseThrow();

        return "Our room prices range from " + money(min) + " (min) to " +
                money(max) + " (max) per night.";
    }


    private String hotelsReply() {

        List<Hotel> hotels = hotelRepository.findAll();

        if (hotels.isEmpty()) {
            return "We don't have any hotels listed right now.";
        }

        StringBuilder sb = new StringBuilder("Here are some of our hotels:\n");

        for (Hotel hotel : hotels.stream().limit(5).toList()) {

            List<Room> rooms = roomRepository.findByHotelId(hotel.getId());

            sb.append("- ").append(hotel.getName());

            if (rooms.isEmpty()) {
                sb.append(" (no rooms added yet)");
            } else {
                BigDecimal min = rooms.stream().map(Room::getPricePerNight)
                        .min(Comparator.naturalOrder()).orElseThrow();
                BigDecimal max = rooms.stream().map(Room::getPricePerNight)
                        .max(Comparator.naturalOrder()).orElseThrow();

                sb.append(" : ").append(rooms.size()).append(" rooms, ")
                        .append("min ").append(money(min))
                        .append(" / max ").append(money(max))
                        .append(" per night");
            }
            sb.append("\n");
        }

        return sb.toString().trim();
    }


    private String roomsReply() {

        List<Room> rooms = roomRepository.findAll();

        if (rooms.isEmpty()) {
            return "No rooms have been added yet.";
        }

        long markedAvailable = rooms.stream()
                .filter(r -> r.getStatus() == RoomStatus.AVAILABLE)
                .count();

        return "We have " + rooms.size() + " rooms in total (" + markedAvailable +
                " marked as available in the system). Ask me \"available rooms\" to see how many are actually free tonight.";
    }


    // ---------------- helpers ----------------

    private String money(BigDecimal amount) {
        NumberFormat nf = NumberFormat.getNumberInstance(Locale.US);
        nf.setMinimumFractionDigits(2);
        nf.setMaximumFractionDigits(2);
        return "LKR " + nf.format(amount);
    }


    private boolean containsAny(String message, String... keywords) {
        for (String keyword : keywords) {
            if (message.contains(keyword)) return true;
        }
        return false;
    }


    private boolean containsAnyWord(String message, String... keywords) {
        for (String keyword : keywords) {
            if (message.matches(".*\\b" + keyword + "\\b.*")) return true;
        }
        return false;
    }
}