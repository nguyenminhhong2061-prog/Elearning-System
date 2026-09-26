package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.UserVocabulary;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.enums.ReviewResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserVocabularyRepository extends JpaRepository<UserVocabulary, Long> {

    List<UserVocabulary> findAllByUserIdAndVocabularyIdIn(Long userId, Collection<Long> vocabularyIds);

    Optional<UserVocabulary> findByUserIdAndVocabularyId(Long userId, Long vocabularyId);

    /**
     * Words of one user due on or before {@code today}, optionally only in one topic or one personal list: the words
     * last rated VAGUE first, then the longest overdue, then by id.
     */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.WordProgress(v, uv)
            from UserVocabulary uv
            join Vocabulary v on v.id = uv.vocabularyId
            where uv.userId = :userId
              and uv.nextReviewAt <= :today
              and (v.createdBy is null or v.createdBy = :userId)
              and (:topicId is null or v.topicId = :topicId)
              and (:listId is null
                   or v.id in (select i.id.vocabularyId from CustomVocabularyListItem i where i.id.listId = :listId))
            order by case when uv.lastReviewResult = :vague then 0 else 1 end, uv.nextReviewAt, v.id
            """)
    List<WordProgress> findDue(
            @Param("userId") Long userId,
            @Param("topicId") Long topicId,
            @Param("listId") Long listId,
            @Param("today") LocalDate today,
            @Param("vague") ReviewResult vague,
            Pageable pageable);

    /**
     * The four counts of the summary in one query. Learning and mastered words are counted among the reviewed ones
     * (last_reviewed_at set), exactly like {@link #findHistory}, so the history totals match the summary.
     */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.LearningCounts(
                coalesce(sum(case when uv.nextReviewAt <= :today then 1 else 0 end), 0L),
                coalesce(sum(case when uv.status = :learning and uv.lastReviewedAt is not null then 1 else 0 end), 0L),
                coalesce(sum(case when uv.status = :mastered and uv.lastReviewedAt is not null then 1 else 0 end), 0L),
                coalesce(sum(case when uv.lastReviewedAt >= :dayStart and uv.lastReviewedAt < :dayEnd
                                  then 1 else 0 end), 0L))
            from UserVocabulary uv
            where uv.userId = :userId
            """)
    LearningCounts countSummary(
            @Param("userId") Long userId,
            @Param("today") LocalDate today,
            @Param("learning") LearningStatus learning,
            @Param("mastered") LearningStatus mastered,
            @Param("dayStart") Instant dayStart,
            @Param("dayEnd") Instant dayEnd);

    /** Words of one user falling due on each day between {@code from} and {@code to}; days without any are absent. */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.DueDateCount(uv.nextReviewAt, count(uv))
            from UserVocabulary uv
            where uv.userId = :userId
              and uv.nextReviewAt between :from and :to
            group by uv.nextReviewAt
            """)
    List<DueDateCount> countDueByDay(
            @Param("userId") Long userId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /**
     * Words the user reviewed at least once, latest review first, optionally only those with one status or those
     * reviewed between {@code dayStart} and {@code dayEnd} (when {@code reviewedInDay} is true).
     */
    @Query(value = """
            select new com.example.datn.modules.vocabulary.repository.WordProgress(v, uv)
            from UserVocabulary uv
            join Vocabulary v on v.id = uv.vocabularyId
            where uv.userId = :userId
              and uv.lastReviewedAt is not null
              and (:status is null or uv.status = :status)
              and (:reviewedInDay = false or (uv.lastReviewedAt >= :dayStart and uv.lastReviewedAt < :dayEnd))
            order by uv.lastReviewedAt desc, uv.id desc
            """,
            countQuery = """
            select count(uv)
            from UserVocabulary uv
            where uv.userId = :userId
              and uv.lastReviewedAt is not null
              and (:status is null or uv.status = :status)
              and (:reviewedInDay = false or (uv.lastReviewedAt >= :dayStart and uv.lastReviewedAt < :dayEnd))
            """)
    Page<WordProgress> findHistory(
            @Param("userId") Long userId,
            @Param("status") LearningStatus status,
            @Param("reviewedInDay") boolean reviewedInDay,
            @Param("dayStart") Instant dayStart,
            @Param("dayEnd") Instant dayEnd,
            Pageable pageable);
}
