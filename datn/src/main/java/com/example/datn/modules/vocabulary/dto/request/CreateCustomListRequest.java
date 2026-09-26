package com.example.datn.modules.vocabulary.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** A new list with its first words: existing ones by id and words typed in by the learner. */
public record CreateCustomListRequest(
        @NotBlank(message = "Name is required") @Size(max = 150, message = "Name must be at most 150 characters") String name,
        @Size(max = CreateCustomListRequest.MAX_WORDS, message = "At most " + CreateCustomListRequest.MAX_WORDS
                + " existing words at once") List<@NotNull(message = "Vocabulary id is required") Long> vocabularyIds,
        @Size(max = CreateCustomListRequest.MAX_WORDS, message = "At most " + CreateCustomListRequest.MAX_WORDS
                + " new words at once") List<@Valid @NotNull(message = "New word is required") NewWordRequest> newWords) {

    /** Words of each kind accepted in one request, so that a single call cannot insert an unbounded number of rows. */
    public static final int MAX_WORDS = 100;

    public CreateCustomListRequest {
        name = name == null ? null : name.strip();
        vocabularyIds = vocabularyIds == null ? List.of() : vocabularyIds;
        newWords = newWords == null ? List.of() : newWords;
    }
}
