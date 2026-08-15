package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.request.UpdateUserRequest;
import com.ijse.Hotel_Management_System.dto.response.UserResponse;
import com.ijse.Hotel_Management_System.enumeration.Role;

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
