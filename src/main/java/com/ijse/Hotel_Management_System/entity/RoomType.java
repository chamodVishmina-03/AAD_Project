package com.ijse.Hotel_Management_System.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "room_types", uniqueConstraints = @UniqueConstraint(columnNames = "name"))
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String name; // e.g. SINGLE, DOUBLE, DELUXE, SUITE

    private String description;

    private Integer maxOccupancy;
}
