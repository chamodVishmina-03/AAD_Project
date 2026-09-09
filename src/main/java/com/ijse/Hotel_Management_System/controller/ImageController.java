package com.ijse.Hotel_Management_System.controller;

import com.ijse.Hotel_Management_System.constant.CommonResponse;
import com.ijse.Hotel_Management_System.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

import static com.ijse.Hotel_Management_System.constant.ResponseCode.OPERATION_SUCCESS;
import static com.ijse.Hotel_Management_System.constant.ResponseMessage.SUCCESS_MESSAGE;


@Slf4j
@RestController
@RequestMapping("/api/uploads")
public class ImageController {

    @PostMapping("/image")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public CommonResponse uploadImage(@RequestParam("file") MultipartFile file) throws IOException {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No file was uploaded.");
        }

        String original = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "image"
        );

        String extension = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) {
            extension = original.substring(dot).toLowerCase();
        }

        String filename = UUID.randomUUID() + extension;

        Path dirPath = Paths.get("uploads");
        Files.createDirectories(dirPath);

        Path targetPath = dirPath.resolve(filename).normalize();
        file.transferTo(targetPath);

        log.info("Stored uploaded image as {}", targetPath);

        String url = "/uploads/" + filename;

        return new CommonResponse(OPERATION_SUCCESS, Map.of("url", url), SUCCESS_MESSAGE);
    }
}