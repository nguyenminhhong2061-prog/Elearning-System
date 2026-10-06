package com.example.datn.modules.vocabulary.repository;

/** How many rows of one kind point at a word, keyed by word id (learners studying it, lists holding it). */
public record WordUsageCount(Long vocabularyId, Long count) {
}
