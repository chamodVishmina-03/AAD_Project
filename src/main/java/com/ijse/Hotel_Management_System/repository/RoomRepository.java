package com.ijse.Hotel_Management_System.repository;
import com.ijse.Hotel_Management_System.entity.Room;
import com.ijse.Hotel_Management_System.enumeration.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByHotelId(Long hotelId);

    List<Room> findByHotelIdAndStatus(Long hotelId, RoomStatus status);

    @Query("""
            select r from Room r
            where r.hotel.id = :hotelId
            and r.id not in (
                select b.room.id from Booking b
                where b.status in ('PENDING','CONFIRMED','CHECKED_IN')
                and b.checkInDate < :checkOut
                and b.checkOutDate > :checkIn
            )
            """)
    List<Room> findAvailableRooms(@Param("hotelId") Long hotelId,
                                   @Param("checkIn") LocalDate checkIn,
                                   @Param("checkOut") LocalDate checkOut);
}
