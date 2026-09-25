package com.example.datn.modules.vocabulary.repository;

/** A number per game: the size of its question bank, or a player's best score (null before the first round). */
public record GameCounts(Long gameId, Long value) {
}
