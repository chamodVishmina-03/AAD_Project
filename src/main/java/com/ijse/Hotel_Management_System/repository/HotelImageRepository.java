package com.ijse.Hotel_Management_System.repository;

import com.ijse.Hotel_Management_System.entity.HotelImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HotelImageRepository extends JpaRepository<HotelImage, Long> {

}
