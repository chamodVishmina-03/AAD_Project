package com.ijse.Hotel_Management_System.entity;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "coupons",
        uniqueConstraints = @UniqueConstraint(columnNames = "code"))


public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String code;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType discountType;

    @NotNull
    @Column(nullable = false)
    private BigDecimal discountValue;

    private BigDecimal minBookingAmount;

    private LocalDate expiryDate;

    @Builder.Default
    private boolean active = true;
}
