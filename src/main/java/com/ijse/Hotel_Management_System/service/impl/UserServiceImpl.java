package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.impl;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.UpdateUserRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.UserResponse;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.User;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.enumeration.Role;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.exception.ResourceNotFoundException;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.UserRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public UserResponse findById(Long id) {
        return toResponse(getUserOrThrow(id));
    }

    @Override
    public UserResponse findByEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = getUserOrThrow(id);
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        log.info("Updated user id={}", id);
        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateRole(Long id, Role role) {
        User user = getUserOrThrow(id);
        user.setRoles(Set.of(role));
        log.info("Changed role for user id={} to {}", id, role);
        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        User user = getUserOrThrow(id);
        user.setActive(false);
        userRepository.save(user);
        log.info("Deactivated user id={}", id);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
        log.info("Deleted user id={}", id);
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .active(user.isActive())
                .roles(user.getRoles().stream().map(Enum::name).collect(Collectors.toSet()))
                .build();
    }
}
