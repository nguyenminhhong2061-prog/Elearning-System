package com.example.datn.modules.vocabulary.mapper;

import com.example.datn.modules.vocabulary.dto.response.TopicResponse;
import com.example.datn.modules.vocabulary.entity.Topic;
import com.example.datn.modules.vocabulary.repository.TopicWordCounts;
import org.springframework.stereotype.Component;

@Component
public class TopicMapper {

    public TopicResponse toResponse(Topic topic, TopicWordCounts counts) {
        return new TopicResponse(
                topic.getId(),
                topic.getName(),
                topic.getDescription(),
                topic.getImageUrl(),
                counts.wordCount(),
                counts.learnedCount(),
                counts.dueCount());
    }
}
