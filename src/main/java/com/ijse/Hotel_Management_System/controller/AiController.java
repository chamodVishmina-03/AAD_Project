package com.ijse.Hotel_Management_System.controller;

import com.ijse.Hotel_Management_System.dto.request.ChatRequest;
import com.ijse.Hotel_Management_System.dto.response.ChatResponse;
import com.ijse.Hotel_Management_System.dto.response.ReviewSummaryResponse;
import com.ijse.Hotel_Management_System.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/hotels/{id}/review-summary")
    public ResponseEntity<ReviewSummaryResponse> reviewSummary(@PathVariable Long id,
                                                                 @RequestParam(defaultValue = "false") boolean force) {
        return ResponseEntity.ok(aiService.summarizeHotelReviews(id, force));
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(aiService.chat(request.message()));
    }
}
