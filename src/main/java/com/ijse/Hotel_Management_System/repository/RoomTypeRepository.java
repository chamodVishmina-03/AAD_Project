package com.ijse.Hotel_Management_System.repository;
import com.ijse.Hotel_Management_System.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {
    Optional<RoomType> findByNameIgnoreCase(String name);
}
