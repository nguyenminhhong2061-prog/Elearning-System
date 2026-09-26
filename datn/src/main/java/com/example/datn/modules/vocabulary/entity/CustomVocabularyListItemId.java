package com.example.datn.modules.vocabulary.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

/** Primary key of custom_vocabulary_list_items: a word appears at most once in a list. */
@Embeddable
public class CustomVocabularyListItemId implements Serializable {

    @Column(nullable = false)
    private Long listId;

    @Column(nullable = false)
    private Long vocabularyId;

    protected CustomVocabularyListItemId() {
    }

    public CustomVocabularyListItemId(Long listId, Long vocabularyId) {
        this.listId = listId;
        this.vocabularyId = vocabularyId;
    }

    public Long getListId() {
        return listId;
    }

    public Long getVocabularyId() {
        return vocabularyId;
    }

    // Hibernate compares ids with equals/hashCode to find entities in the persistence context.
    @Override
    public boolean equals(Object other) {
        return other instanceof CustomVocabularyListItemId that
                && Objects.equals(listId, that.listId)
                && Objects.equals(vocabularyId, that.vocabularyId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(listId, vocabularyId);
    }
}
