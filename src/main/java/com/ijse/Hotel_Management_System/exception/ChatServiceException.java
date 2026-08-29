package com.ijse.Hotel_Management_System.exception;


public class ChatServiceException extends RuntimeException {
    public ChatServiceException(String message) {
        super(message);
    }
    public ChatServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}