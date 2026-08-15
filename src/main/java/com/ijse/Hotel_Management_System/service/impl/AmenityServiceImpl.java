package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.impl;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.AmenityRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.Amenity;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.exception.DuplicateResourceException;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.exception.ResourceNotFoundException;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.AmenityRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.AmenityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AmenityServiceImpl implements AmenityService {

    private final AmenityRepository amenityRepository;

    @Override
    @Transactional
    public Amenity create(AmenityRequest request) {
        if (amenityRepository.findByNameIgnoreCase(request.name()).isPresent()) {
            throw new DuplicateResourceException("Amenity already exists: " + request.name());
        }
        Amenity amenity = Amenity.builder()
                .name(request.name())
                .description(request.description())
                .icon(request.icon())
                .build();
        return amenityRepository.save(amenity);
    }

    @Override
    @Transactional
    public Amenity update(Long id, AmenityRequest request) {
        Amenity amenity = findById(id);
        amenity.setName(request.name());
        amenity.setDescription(request.description());
        amenity.setIcon(request.icon());
        return amenityRepository.save(amenity);
    }

    @Override
    public List<Amenity> findAll() {
        return amenityRepository.findAll();
    }

    @Override
    public Amenity findById(Long id) {
        return amenityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Amenity not found with id: " + id));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!amenityRepository.existsById(id)) {
            throw new ResourceNotFoundException("Amenity not found with id: " + id);
        }
        amenityRepository.deleteById(id);
    }
}
