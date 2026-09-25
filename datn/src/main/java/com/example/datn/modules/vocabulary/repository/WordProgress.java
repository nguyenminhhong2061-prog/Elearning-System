package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.UserVocabulary;
import com.example.datn.modules.vocabulary.entity.Vocabulary;

/** A word with one user's progress on it; {@code progress} is null for a word the user never reviewed. */
public record WordProgress(Vocabulary word, UserVocabulary progress) {
}
