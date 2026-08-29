package com.ijse.Hotel_Management_System.ai;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.ijse.Hotel_Management_System.exception.ChatServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ChatClient {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper;

    @Value("${ai.enabled:true}")
    private boolean enabled;

    @Value("${ai.base-url}")
    private String baseUrl;

    @Value("${ai.api-key}")
    private String apiKey;

    @Value("${ai.model}")
    private String model;

    @Value("${ai.max-tokens:600}")
    private int maxTokens;

    @Value("${ai.anthropic-version}")
    private String anthropicVersion;

    public ChatClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }


    public String complete(String systemPrompt, String userPrompt) {
        if (!enabled) {
            throw new ChatServiceException("AI features are currently disabled.");
        }
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("CHANGE_ME")) {
            throw new ChatServiceException("AI service is not configured. Set the ANTHROPIC_API_KEY environment variable.");
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "max_tokens", maxTokens,
                    "system", systemPrompt,
                    "messages", List.of(Map.of("role", "user", "content", userPrompt))
            );

            String json = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", anthropicVersion)
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Anthropic API returned status {}: {}", response.statusCode(), response.body());
                throw new ChatServiceException("AI service returned an error (status " + response.statusCode() + ").");
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode contentBlocks = root.path("content");

            StringBuilder text = new StringBuilder();
            if (contentBlocks.isArray()) {
                for (JsonNode block : contentBlocks) {
                    if ("text".equals(block.path("type").asText())) {
                        text.append(block.path("text").asText());
                    }
                }
            }

            if (text.isEmpty()) {
                throw new ChatServiceException("AI service returned an empty response.");
            }

            return text.toString().trim();

        } catch (ChatServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to call Anthropic API", e);
            throw new ChatServiceException("Could not reach the AI service.", e);
        }
    }
}