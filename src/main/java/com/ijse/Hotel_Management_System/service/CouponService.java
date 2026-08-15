package com.ijse.HOTEL_MANAGEMENT_SYSTEM.service;

import com.ijse.HOTEL_MANAGEMENT_SYSTEM.dto.request.CouponRequest;
import com.ijse.HOTEL_MANAGEMENT_SYSTEM.entity.Coupon;

import java.util.List;

public interface CouponService {
    Coupon create(CouponRequest request);
    List<Coupon> findAll();
    Coupon findById(Long id);
    void deactivate(Long id);
    void delete(Long id);
}
