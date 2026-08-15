package com.ijse.Hotel_Management_System.repository;

import com.ijse.Hotel_Management_System.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    List<Booking> findByRoomId(Long roomId);

    @Query("""
            select case when count(b) > 0 then true else false end from Booking b
            where b.room.id = :roomId
            and b.status in ('PENDING','CONFIRMED','CHECKED_IN')
            and b.checkInDate < :checkOut
            and b.checkOutDate > :checkIn
            """)
    boolean existsOverlappingBooking(@Param("roomId") Long roomId,
                                     @Param("checkIn") LocalDate checkIn,
                                     @Param("checkOut") LocalDate checkOut);
}