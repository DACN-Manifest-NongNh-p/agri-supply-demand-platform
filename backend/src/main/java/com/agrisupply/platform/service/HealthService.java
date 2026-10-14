package com.agrisupply.platform.service;

import com.agrisupply.platform.dto.HealthResponse;
import org.springframework.stereotype.Service;

@Service
public class HealthService {

    public HealthResponse getHealth() {
        return new HealthResponse("UP");
    }
}