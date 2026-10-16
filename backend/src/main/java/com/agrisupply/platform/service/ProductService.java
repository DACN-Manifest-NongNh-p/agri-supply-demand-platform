package com.agrisupply.platform.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agrisupply.platform.domain.Product;
import com.agrisupply.platform.dto.SiteDtos.ProductRequest;
import com.agrisupply.platform.dto.SiteDtos.ProductView;
import com.agrisupply.platform.repository.ProductRepository;

/** The product catalog. Products are switched off rather than deleted, so past batches and demands keep their name. */
@Service
public class ProductService {

    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ProductView> all() {
        return repository.findAllByOrderBySortOrderAscNameAsc().stream().map(ProductView::of).toList();
    }

    @Transactional
    public ProductView create(ProductRequest request, String user) {
        return save(new Product(), request, user);
    }

    @Transactional
    public ProductView update(long id, ProductRequest request, String user) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product " + id + " not found"));
        return save(product, request, user);
    }

    private ProductView save(Product product, ProductRequest request, String user) {
        String name = request.name().strip();
        repository.findByNameIgnoreCase(name)
                .filter(other -> !other.getId().equals(product.getId()))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, name + " is already in the catalog");
                });
        String nameVi = request.nameVi() == null || request.nameVi().isBlank() ? null : request.nameVi().strip();
        product.update(name, nameVi, request.category(), request.coldChain(), request.active(), request.sortOrder(), user);
        return ProductView.of(repository.save(product));
    }
}
