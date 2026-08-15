package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.impl;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.HotelRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.ImageRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.response.HotelResponse;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.City;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.Hotel;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.HotelImage;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.exception.ResourceNotFoundException;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.CityRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.HotelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HotelServiceImpl implements com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.HotelService {

    private final HotelRepository hotelRepository;
    private final CityRepository cityRepository;

    @Override
    @Transactional
    public HotelResponse create(HotelRequest request) {
        City city = cityRepository.findById(request.cityId())
                .orElseThrow(() -> new ResourceNotFoundException("City not found with id: " + request.cityId()));

        Hotel hotel = Hotel.builder()
                .name(request.name())
                .description(request.description())
                .address(request.address())
                .city(city)
                .starRating(request.starRating())
                .phone(request.phone())
                .email(request.email())
                .active(true)
                .build();

        hotel = hotelRepository.save(hotel);
        log.info("Created hotel id={} name={}", hotel.getId(), hotel.getName());
        return toResponse(hotel);
    }

    @Override
    @Transactional
    public HotelResponse update(Long id, HotelRequest request) {
        Hotel hotel = getHotelOrThrow(id);
        City city = cityRepository.findById(request.cityId())
                .orElseThrow(() -> new ResourceNotFoundException("City not found with id: " + request.cityId()));

        hotel.setName(request.name());
        hotel.setDescription(request.description());
        hotel.setAddress(request.address());
        hotel.setCity(city);
        hotel.setStarRating(request.starRating());
        hotel.setPhone(request.phone());
        hotel.setEmail(request.email());

        log.info("Updated hotel id={}", id);
        return toResponse(hotelRepository.save(hotel));
    }

    @Override
    public HotelResponse findById(Long id) {
        return toResponse(getHotelOrThrow(id));
    }

    @Override
    public List<HotelResponse> findAll() {
        return hotelRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<HotelResponse> search(String name, Long cityId) {
        List<Hotel> hotels;
        if (StringUtils.hasText(name)) {
            hotels = hotelRepository.findByNameContainingIgnoreCase(name);
        } else if (cityId != null) {
            hotels = hotelRepository.findByCityIdAndActiveTrue(cityId);
        } else {
            hotels = hotelRepository.findAll();
        }
        return hotels.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addImage(Long hotelId, ImageRequest request) {
        Hotel hotel = getHotelOrThrow(hotelId);
        HotelImage image = HotelImage.builder()
                .hotel(hotel)
                .imageUrl(request.imageUrl())
                .caption(request.caption())
                .build();
        hotel.getImages().add(image);
        hotelRepository.save(hotel);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!hotelRepository.existsById(id)) {
            throw new ResourceNotFoundException("Hotel not found with id: " + id);
        }
        hotelRepository.deleteById(id);
        log.info("Deleted hotel id={}", id);
    }

    private Hotel getHotelOrThrow(Long id) {
        return hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + id));
    }

    private HotelResponse toResponse(Hotel hotel) {
        return HotelResponse.builder()
                .id(hotel.getId())
                .name(hotel.getName())
                .description(hotel.getDescription())
                .address(hotel.getAddress())
                .cityName(hotel.getCity() != null ? hotel.getCity().getName() : null)
                .country(hotel.getCity() != null ? hotel.getCity().getCountry() : null)
                .starRating(hotel.getStarRating())
                .phone(hotel.getPhone())
                .email(hotel.getEmail())
                .active(hotel.isActive())
                .imageUrls(hotel.getImages().stream().map(HotelImage::getImageUrl).collect(Collectors.toList()))
                .build();
    }
}
