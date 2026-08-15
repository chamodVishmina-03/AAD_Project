package com.ijse.Hotel_Management_System.repository;

import com.ijse.Hotel_Management_System.entity.ExtraService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExtraServiceRepository extends JpaRepository<ExtraService, Long> {
    java.util.List<ExtraService> findByHotelId(Long hotelId);
}
