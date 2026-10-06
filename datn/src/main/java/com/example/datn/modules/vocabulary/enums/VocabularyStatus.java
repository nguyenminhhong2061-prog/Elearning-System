package com.example.datn.modules.vocabulary.enums;

/**
 * Whether learners still meet a system word (vocabulary.status, tbl_vocabulary.status of the design). Deleting a word
 * that learners study, keep in a list or that a test question uses only hides it (scenario 21): it leaves sessions,
 * reviews, games, searches and lists, while its history stays. The admin screens call a hidden word "Lưu trữ".
 */
public enum VocabularyStatus {
    VISIBLE,
    HIDDEN
}
