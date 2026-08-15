package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.UpdateUserRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.UserResponse;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.enumeration.Role;

import java.util.List;

public interface UserService {
    List<UserResponse> findAll();
    UserResponse findById(Long id);
    UserResponse findByEmail(String email);
    UserResponse update(Long id, UpdateUserRequest request);
    UserResponse updateRole(Long id, Role role);
    void deactivate(Long id);
    void delete(Long id);
}
