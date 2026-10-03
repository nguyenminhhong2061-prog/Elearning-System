package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.VocabularyReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface VocabularyReviewRepository extends JpaRepository<VocabularyReview, Long> {

    /** A user's ratings since {@code since}, counted per rating; ratings never given are absent. */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.ResultCount(r.result, count(r))
            from VocabularyReview r
            join UserVocabulary uv on uv.id = r.userVocabularyId
            where uv.userId = :userId
              and r.reviewedAt >= :since
            group by r.result
            """)
    List<ResultCount> countByResultSince(@Param("userId") Long userId, @Param("since") Instant since);
}
