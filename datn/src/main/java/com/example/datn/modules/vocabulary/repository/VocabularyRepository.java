package com.example.datn.modules.vocabulary.repository;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

/**
 * Every query that lists words for a user applies the visibility rule of docs/api/custom-lists.md: system words
 * (created_by NULL) plus the words that user typed in ({@code v.createdBy is null or v.createdBy = :userId}), the
 * same rule as {@link Vocabulary#isVisibleTo}.
 */
public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {

    /**
     * Words matching the optional filters, easiest first: by CEFR level (A1..C2 sort alphabetically in level order),
     * then by word ignoring case, then by id. The order is part of the API contract: pages are loaded one after
     * another, so it must come from the database, not from the browser.
     *
     * @param pattern a LIKE pattern in lower case, with '!' as the escape character, or null for no text filter
     */
    @Query("""
            select v from Vocabulary v
            where (v.createdBy is null or v.createdBy = :userId)
              and (:topicId is null or v.topicId = :topicId)
              and (:level is null or v.difficultyLevel = :level)
              and (:pattern is null
                   or lower(v.word) like :pattern escape '!'
                   or lower(v.meaning) like :pattern escape '!')
            order by v.difficultyLevel, lower(v.word), v.id
            """)
    Page<Vocabulary> search(
            @Param("userId") Long userId,
            @Param("topicId") Long topicId,
            @Param("level") CefrLevel level,
            @Param("pattern") String pattern,
            Pageable pageable);

    /**
     * Word, learned and due counts of the given topics for one user, in a single grouped query (not one per topic).
     * Topics without words are absent from the result.
     */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.TopicWordCounts(
                v.topicId,
                count(v),
                sum(case when uv.status in :learned then 1 else 0 end),
                sum(case when uv.nextReviewAt <= :today then 1 else 0 end))
            from Vocabulary v
            left join UserVocabulary uv on uv.vocabularyId = v.id and uv.userId = :userId
            where v.topicId in :topicIds
              and (v.createdBy is null or v.createdBy = :userId)
            group by v.topicId
            """)
    List<TopicWordCounts> countByTopic(
            @Param("topicIds") Collection<Long> topicIds,
            @Param("userId") Long userId,
            @Param("learned") Collection<LearningStatus> learned,
            @Param("today") LocalDate today);

    /**
     * Words of a topic the user has not started (no progress row, or one still NEW), in the same easiest-first order as
     * {@link #search}.
     */
    @Query("""
            select v from Vocabulary v
            where v.topicId = :topicId
              and (v.createdBy is null or v.createdBy = :userId)
              and not exists (
                  select 1 from UserVocabulary uv
                  where uv.vocabularyId = v.id and uv.userId = :userId and uv.status <> :newStatus)
            order by v.difficultyLevel, lower(v.word), v.id
            """)
    List<Vocabulary> findNewInTopic(
            @Param("topicId") Long topicId,
            @Param("userId") Long userId,
            @Param("newStatus") LearningStatus newStatus,
            Pageable pageable);

    /** The words of a personal list the user can see, in the same easiest-first order as {@link #search}. */
    @Query(value = """
            select v from Vocabulary v
            where v.id in (select i.id.vocabularyId from CustomVocabularyListItem i where i.id.listId = :listId)
              and (v.createdBy is null or v.createdBy = :userId)
            order by v.difficultyLevel, lower(v.word), v.id
            """,
            countQuery = """
            select count(v) from Vocabulary v
            where v.id in (select i.id.vocabularyId from CustomVocabularyListItem i where i.id.listId = :listId)
              and (v.createdBy is null or v.createdBy = :userId)
            """)
    Page<Vocabulary> findInList(
            @Param("listId") Long listId,
            @Param("userId") Long userId,
            Pageable pageable);

    /** Every word of a topic the user can see: what a game round on that topic is dealt from. */
    @Query("select v from Vocabulary v where v.topicId = :topicId and (v.createdBy is null or v.createdBy = :userId)")
    List<Vocabulary> findAllVisibleInTopic(@Param("topicId") Long topicId, @Param("userId") Long userId);

    /** Every word of a personal list the user can see: what a game round on that list is dealt from. */
    @Query("""
            select v from Vocabulary v
            where v.id in (select i.id.vocabularyId from CustomVocabularyListItem i where i.id.listId = :listId)
              and (v.createdBy is null or v.createdBy = :userId)
            """)
    List<Vocabulary> findAllVisibleInList(@Param("listId") Long listId, @Param("userId") Long userId);

    /** Every system word of a topic: what a game round is dealt from when the player chose no topic or list. */
    @Query("select v from Vocabulary v where v.createdBy is null and v.topicId is not null")
    List<Vocabulary> findAllSystemWordsInTopics();

    /** Words of a personal list the user has not started, easiest first, like {@link #findNewInTopic}. */
    @Query("""
            select v from Vocabulary v
            where v.id in (select i.id.vocabularyId from CustomVocabularyListItem i where i.id.listId = :listId)
              and (v.createdBy is null or v.createdBy = :userId)
              and not exists (
                  select 1 from UserVocabulary uv
                  where uv.vocabularyId = v.id and uv.userId = :userId and uv.status <> :newStatus)
            order by v.difficultyLevel, lower(v.word), v.id
            """)
    List<Vocabulary> findNewInList(
            @Param("listId") Long listId,
            @Param("userId") Long userId,
            @Param("newStatus") LearningStatus newStatus,
            Pageable pageable);
}
