package com.ijse.Hotel_Management_System.controller;

import com.ijse.Hotel_Management_System.constant.CommonResponse;
import com.ijse.Hotel_Management_System.dto.request.ChatRequest;
import com.ijse.Hotel_Management_System.dto.response.ChatResponse;
import com.ijse.Hotel_Management_System.dto.response.ReviewSummaryResponse;
import com.ijse.Hotel_Management_System.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.ijse.Hotel_Management_System.constant.ResponseCode.OPERATION_SUCCESS;
import static com.ijse.Hotel_Management_System.constant.ResponseMessage.SUCCESS_MESSAGE;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/hotels/{id}/review-summary")
    public CommonResponse reviewSummary(@PathVariable Long id,
                                        @RequestParam(defaultValue = "false") boolean force) {


        aiService.summarizeHotelReviews(id,force);
        return new CommonResponse(SUCCESS_MESSAGE, OPERATION_SUCCESS);

    }


    @PostMapping("/chat")
    public CommonResponse chat(@Valid @RequestBody ChatRequest request) {
       aiService.chat(request.message());
       return new CommonResponse(SUCCESS_MESSAGE,OPERATION_SUCCESS);

    }


}




