package com.ijse.Hotel_Management_System.repository;

import com.ijse.Hotel_Management_System.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CityRepository extends JpaRepository<City, Long> {

}
