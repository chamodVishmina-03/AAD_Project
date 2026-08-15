package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.request.LoginRequest;
import com.ijse.Hotel_Management_System.dto.request.RegisterRequest;
import com.ijse.Hotel_Management_System.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(String refreshToken);
    void logout(String refreshToken);
}
