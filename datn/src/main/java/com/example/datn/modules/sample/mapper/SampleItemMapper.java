package com.example.datn.modules.sample.mapper;

import com.example.datn.modules.sample.dto.response.SampleItemResponse;
import com.example.datn.modules.sample.entity.SampleItem;
import org.springframework.stereotype.Component;

@Component
public class SampleItemMapper {

    public SampleItemResponse toResponse(SampleItem item) {
        return new SampleItemResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getStatus(),
                item.getCreatedAt());
    }
}
