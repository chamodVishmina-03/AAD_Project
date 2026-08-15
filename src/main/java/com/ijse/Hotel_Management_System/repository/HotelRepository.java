package com.ijse.Hotel_Management_System.repository;
import com.ijse.Hotel_Management_System.entity.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long> {
    List<Hotel> findByCityIdAndActiveTrue(Long cityId);
    List<Hotel> findByNameContainingIgnoreCase(String name);
}
