package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.modules.vocabulary.enums.DeleteResult;

/** Body of DELETE /api/vocabulary/{id}: {@code { "result": "HIDDEN" }} or {@code { "result": "DELETED" }}. */
public record DeleteResultResponse(DeleteResult result) {
}
