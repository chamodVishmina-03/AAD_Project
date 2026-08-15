package com.ijse.Hotel_Management_System.service.impl;

import com.ijse.Hotel_Management_System.dto.request.RoomTypeRequest;
import com.ijse.Hotel_Management_System.entity.RoomType;
import com.ijse.Hotel_Management_System.exception.DuplicateResourceException;
import com.ijse.Hotel_Management_System.exception.ResourceNotFoundException;
import com.ijse.Hotel_Management_System.repository.RoomTypeRepository;
import com.ijse.Hotel_Management_System.service.RoomTypeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomTypeServiceImpl implements RoomTypeService {

    private final RoomTypeRepository roomTypeRepository;

    @Override
    @Transactional
    public RoomType create(RoomTypeRequest request) {
        if (roomTypeRepository.findByNameIgnoreCase(request.name()).isPresent()) {
            throw new DuplicateResourceException("Room type already exists: " + request.name());
        }
        RoomType roomType = RoomType.builder()
                .name(request.name())
                .description(request.description())
                .maxOccupancy(request.maxOccupancy())
                .build();
        return roomTypeRepository.save(roomType);
    }

    @Override
    @Transactional
    public RoomType update(Long id, RoomTypeRequest request) {
        RoomType roomType = findById(id);
        roomType.setName(request.name());
        roomType.setDescription(request.description());
        roomType.setMaxOccupancy(request.maxOccupancy());
        return roomTypeRepository.save(roomType);
    }

    @Override
    public List<RoomType> findAll() {
        return roomTypeRepository.findAll();
    }

    @Override
    public RoomType findById(Long id) {
        return roomTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + id));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!roomTypeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Room type not found with id: " + id);
        }
        roomTypeRepository.deleteById(id);
    }
}
