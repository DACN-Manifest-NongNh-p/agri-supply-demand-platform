package com.agrisupply.platform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agrisupply.platform.domain.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findAllByOrderBySortOrderAscNameAsc();

    Optional<Product> findByNameIgnoreCase(String name);
}
