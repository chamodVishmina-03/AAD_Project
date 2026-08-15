package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.impl;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.ExtraServiceRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.ExtraService;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.Hotel;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.exception.ResourceNotFoundException;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.ExtraServiceRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.HotelRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.ExtraServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExtraServiceServiceImpl implements ExtraServiceService {

    private final ExtraServiceRepository extraServiceRepository;
    private final HotelRepository hotelRepository;

    @Override
    @Transactional
    public ExtraService create(ExtraServiceRequest request) {
        Hotel hotel = hotelRepository.findById(request.hotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + request.hotelId()));
        ExtraService service = ExtraService.builder()
                .hotel(hotel)
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .build();
        return extraServiceRepository.save(service);
    }

    @Override
    @Transactional
    public ExtraService update(Long id, ExtraServiceRequest request) {
        ExtraService service = findById(id);
        service.setName(request.name());
        service.setDescription(request.description());
        service.setPrice(request.price());
        return extraServiceRepository.save(service);
    }

    @Override
    public List<ExtraService> findByHotel(Long hotelId) {
        return extraServiceRepository.findByHotelId(hotelId);
    }

    @Override
    public ExtraService findById(Long id) {
        return extraServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Extra service not found with id: " + id));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!extraServiceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Extra service not found with id: " + id);
        }
        extraServiceRepository.deleteById(id);
    }
}
