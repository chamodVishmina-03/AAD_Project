package com.ijse.Hotel_Management_System.config;

import com.ijse.Hotel_Management_System.entity.User;
import com.ijse.Hotel_Management_System.enumeration.Role;
import com.ijse.Hotel_Management_System.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;


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

    }


}



