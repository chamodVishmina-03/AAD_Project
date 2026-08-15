package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.LoginRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.RegisterRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(String refreshToken);
    void logout(String refreshToken);
}
