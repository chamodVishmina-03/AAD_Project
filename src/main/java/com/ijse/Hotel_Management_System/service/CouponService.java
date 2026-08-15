package com.ijse.Hotel_Management_System.service;

import com.ijse.Hotel_Management_System.dto.request.CouponRequest;
import com.ijse.Hotel_Management_System.entity.Coupon;

import java.util.List;

public interface CouponService {
    Coupon create(CouponRequest request);
    List<Coupon> findAll();
    Coupon findById(Long id);
    void deactivate(Long id);
    void delete(Long id);
}
