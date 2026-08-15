package com.ijse.Hotel_Management_System.exception;


public class AiServiceException extends RuntimeException {
    public AiServiceException(String message) {
        super(message);
    }
    public AiServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}