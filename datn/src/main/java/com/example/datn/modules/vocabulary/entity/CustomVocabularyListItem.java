package com.example.datn.modules.vocabulary.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** One word of a learner's list. Removing it does not touch the word or the learner's progress on it. */
@Entity
@Table(name = "custom_vocabulary_list_items")
public class CustomVocabularyListItem {

    @EmbeddedId
    private CustomVocabularyListItemId id;

    protected CustomVocabularyListItem() {
    }

    public CustomVocabularyListItem(Long listId, Long vocabularyId) {
        this.id = new CustomVocabularyListItemId(listId, vocabularyId);
    }

    public CustomVocabularyListItemId getId() {
        return id;
    }
}
