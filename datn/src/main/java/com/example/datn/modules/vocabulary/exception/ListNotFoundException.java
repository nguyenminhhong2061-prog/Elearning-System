package com.example.datn.modules.vocabulary.exception;

/** A personal word list that does not exist or belongs to someone else (both answer 404, docs/api/custom-lists.md). */
public class ListNotFoundException extends RuntimeException {

    public ListNotFoundException(Long id) {
        super("List not found: " + id);
    }
}
