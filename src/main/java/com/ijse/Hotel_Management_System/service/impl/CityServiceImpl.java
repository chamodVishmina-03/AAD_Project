package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.impl;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.CityRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.City;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.exception.ResourceNotFoundException;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.repository.CityRepository;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.service.CityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CityServiceImpl implements CityService {

    private final CityRepository cityRepository;

    @Override
    @Transactional
    public City create(CityRequest request) {
        City city = City.builder().name(request.name()).country(request.country()).build();
        city = cityRepository.save(city);
        log.info("Created city id={} name={}", city.getId(), city.getName());
        return city;
    }

    @Override
    @Transactional
    public City update(Long id, CityRequest request) {
        City city = findById(id);
        city.setName(request.name());
        city.setCountry(request.country());
        return cityRepository.save(city);
    }

    @Override
    public List<City> findAll() {
        return cityRepository.findAll();
    }

    @Override
    public City findById(Long id) {
        return cityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("City not found with id: " + id));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!cityRepository.existsById(id)) {
            throw new ResourceNotFoundException("City not found with id: " + id);
        }
        cityRepository.deleteById(id);
        log.info("Deleted city id={}", id);
    }
}
