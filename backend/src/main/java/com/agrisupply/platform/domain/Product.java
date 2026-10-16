package com.agrisupply.platform.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A product producers can declare and buyers can ask for. Inactive products are kept for history. */
@Entity
@Table(name = "product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(name = "name_vi", length = 80)
    private String nameVi;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductCategory category;

    @Column(name = "cold_chain", nullable = false)
    private boolean coldChain;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    public void update(String name, String nameVi, ProductCategory category, boolean coldChain, boolean active, int sortOrder, String updatedBy) {
        this.name = name;
        this.nameVi = nameVi;
        this.category = category;
        this.coldChain = coldChain;
        this.active = active;
        this.sortOrder = sortOrder;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getNameVi() {
        return nameVi;
    }

    public ProductCategory getCategory() {
        return category;
    }

    public boolean isColdChain() {
        return coldChain;
    }

    public boolean isActive() {
        return active;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
