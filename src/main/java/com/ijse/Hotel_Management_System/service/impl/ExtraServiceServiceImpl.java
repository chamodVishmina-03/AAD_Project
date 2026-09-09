package com.ijse.Hotel_Management_System.service.impl;

import com.ijse.Hotel_Management_System.dto.request.ExtraServiceRequest;
import com.ijse.Hotel_Management_System.dto.response.ExtraServiceResponse;
import com.ijse.Hotel_Management_System.entity.ExtraService;
import com.ijse.Hotel_Management_System.entity.Hotel;
import com.ijse.Hotel_Management_System.exception.ResourceNotFoundException;
import com.ijse.Hotel_Management_System.repository.ExtraServiceRepository;
import com.ijse.Hotel_Management_System.repository.HotelRepository;
import com.ijse.Hotel_Management_System.service.ExtraServiceService;
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
    public ExtraServiceResponse create(ExtraServiceRequest request) {
        Hotel hotel = hotelRepository.findById(request.hotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + request.hotelId()));
        ExtraService service = ExtraService.builder()
                .hotel(hotel)
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .build();
        return toResponse(extraServiceRepository.save(service));
    }

    @Override
    @Transactional
    public ExtraServiceResponse update(Long id, ExtraServiceRequest request) {
        ExtraService service = findEntityById(id);
        service.setName(request.name());
        service.setDescription(request.description());
        service.setPrice(request.price());
        return toResponse(extraServiceRepository.save(service));
    }

    @Override
    public List<ExtraServiceResponse> findByHotel(Long hotelId) {
        return extraServiceRepository.findByHotelId(hotelId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ExtraServiceResponse findById(Long id) {
        return toResponse(findEntityById(id));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!extraServiceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Extra service not found with id: " + id);
        }
        extraServiceRepository.deleteById(id);
    }

    private ExtraService findEntityById(Long id) {
        return extraServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Extra service not found with id: " + id));
    }


    private ExtraServiceResponse toResponse(ExtraService service) {
        Hotel hotel = service.getHotel();
        return ExtraServiceResponse.builder()
                .id(service.getId())
                .hotelId(hotel.getId())
                .hotelName(hotel.getName())
                .name(service.getName())
                .description(service.getDescription())
                .price(service.getPrice())
                .build();
    }
}