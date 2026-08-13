package com.ijse.Hotel_Management_System.entity;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;





@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "extra_services")
public class ExtraService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    @NotBlank
    @Column(nullable = false)
    private String name;

    private String description;

    @NotNull
    @Column(nullable = false)
    private BigDecimal price;
}
