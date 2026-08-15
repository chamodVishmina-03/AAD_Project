package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.impl;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.ImageRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.RoomRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.RoomResponse;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.*;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.exception.BadRequestException;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.exception.ResourceNotFoundException;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.AmenityRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.HotelRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.RoomRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.RoomTypeRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final HotelRepository hotelRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final AmenityRepository amenityRepository;

    @Override
    @Transactional
    public RoomResponse create(RoomRequest request) {
        Hotel hotel = hotelRepository.findById(request.hotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + request.hotelId()));
        RoomType roomType = roomTypeRepository.findById(request.roomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + request.roomTypeId()));

        Room room = Room.builder()
                .hotel(hotel)
                .roomType(roomType)
                .roomNumber(request.roomNumber())
                .floorNo(request.floorNo())
                .pricePerNight(request.pricePerNight())
                .amenities(resolveAmenities(request.amenityIds()))
                .build();

        room = roomRepository.save(room);
        log.info("Created room id={} number={} hotelId={}", room.getId(), room.getRoomNumber(), hotel.getId());
        return toResponse(room);
    }

    @Override
    @Transactional
    public RoomResponse update(Long id, RoomRequest request) {
        Room room = getRoomOrThrow(id);
        RoomType roomType = roomTypeRepository.findById(request.roomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + request.roomTypeId()));

        room.setRoomType(roomType);
        room.setRoomNumber(request.roomNumber());
        room.setFloorNo(request.floorNo());
        room.setPricePerNight(request.pricePerNight());
        room.setAmenities(resolveAmenities(request.amenityIds()));

        return toResponse(roomRepository.save(room));
    }

    @Override
    public RoomResponse findById(Long id) {
        return toResponse(getRoomOrThrow(id));
    }

    @Override
    public List<RoomResponse> findByHotel(Long hotelId) {
        return roomRepository.findByHotelId(hotelId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<RoomResponse> findAvailable(Long hotelId, LocalDate checkIn, LocalDate checkOut) {
        if (!checkIn.isBefore(checkOut)) {
            throw new BadRequestException("checkInDate must be before checkOutDate");
        }
        return roomRepository.findAvailableRooms(hotelId, checkIn, checkOut).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addImage(Long roomId, ImageRequest request) {
        Room room = getRoomOrThrow(roomId);
        RoomImage image = RoomImage.builder()
                .room(room)
                .imageUrl(request.imageUrl())
                .caption(request.caption())
                .build();
        room.getImages().add(image);
        roomRepository.save(room);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new ResourceNotFoundException("Room not found with id: " + id);
        }
        roomRepository.deleteById(id);
        log.info("Deleted room id={}", id);
    }

    private Set<Amenity> resolveAmenities(Set<Long> amenityIds) {
        if (amenityIds == null || amenityIds.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(amenityRepository.findAllById(amenityIds));
    }

    private Room getRoomOrThrow(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
    }

    private RoomResponse toResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .hotelId(room.getHotel().getId())
                .hotelName(room.getHotel().getName())
                .roomType(room.getRoomType().getName())
                .roomNumber(room.getRoomNumber())
                .floorNo(room.getFloorNo())
                .pricePerNight(room.getPricePerNight())
                .status(room.getStatus())
                .amenities(room.getAmenities().stream().map(Amenity::getName).collect(Collectors.toSet()))
                .imageUrls(room.getImages().stream().map(RoomImage::getImageUrl).collect(Collectors.toList()))
                .build();
    }
}
