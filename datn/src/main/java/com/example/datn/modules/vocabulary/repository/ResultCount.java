package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.enums.ReviewResult;

/** How many times one rating was given. */
public record ResultCount(ReviewResult result, Long count) {
}
