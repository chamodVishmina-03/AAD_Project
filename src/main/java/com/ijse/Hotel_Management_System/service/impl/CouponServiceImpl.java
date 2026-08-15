package com.ijse.Hotel_Management_System.service.impl;

import com.ijse.Hotel_Management_System.dto.request.CouponRequest;
import com.ijse.Hotel_Management_System.entity.Coupon;
import com.ijse.Hotel_Management_System.exception.DuplicateResourceException;
import com.ijse.Hotel_Management_System.exception.ResourceNotFoundException;
import com.ijse.Hotel_Management_System.repository.CouponRepository;
import com.ijse.Hotel_Management_System.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    @Override
    @Transactional
    public Coupon create(CouponRequest request) {
        if (couponRepository.findByCodeIgnoreCase(request.code()).isPresent()) {
            throw new DuplicateResourceException("Coupon code already exists: " + request.code());
        }
        Coupon coupon = Coupon.builder()
                .code(request.code().toUpperCase())
                .discountType(request.discountType())
                .discountValue(request.discountValue())
                .minBookingAmount(request.minBookingAmount())
                .expiryDate(request.expiryDate())
                .active(true)
                .build();
        return couponRepository.save(coupon);
    }

    @Override
    public List<Coupon> findAll() {
        return couponRepository.findAll();
    }

    @Override
    public Coupon findById(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        Coupon coupon = findById(id);
        coupon.setActive(false);
        couponRepository.save(coupon);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!couponRepository.existsById(id)) {
            throw new ResourceNotFoundException("Coupon not found with id: " + id);
        }
        couponRepository.deleteById(id);
    }
}
