package com.ijse.HOTEL_MANAGEMENT_SYSTEM.config;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.User;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.enumeration.Role;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Seeds a default ADMIN account on first startup so the API is usable immediately.
 * Safe to run repeatedly - it only inserts when the account does not already exist.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmailIgnoreCase("admin@hotel.com")) {
            return;
        }

        User admin = User.builder()
                .fullName("System Administrator")
                .email("admin@hotel.com")
                .password(passwordEncoder.encode("Admin@123"))
                .phone("0000000000")
                .active(true)
                .roles(Set.of(Role.ADMIN))
                .build();

        userRepository.save(admin);
        log.info("Seeded default admin account -> email: admin@hotel.com / password: Admin@123 (CHANGE THIS after first login)");
    }
}
