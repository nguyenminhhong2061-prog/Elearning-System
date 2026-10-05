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
 * (created_by NULL) plus the words that user typed in ({@code v.createdBy is null or v.createdBy = :userId}), never a
 * word an admin hid (scenario 21), the same rule as {@link Vocabulary#isVisibleTo}.
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
            where (v.createdBy is null or v.createdBy = :userId) and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE
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
              and (v.createdBy is null or v.createdBy = :userId) and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE
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
              and (v.createdBy is null or v.createdBy = :userId) and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE
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
              and (v.createdBy is null or v.createdBy = :userId) and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE
            order by v.difficultyLevel, lower(v.word), v.id
            """,
            countQuery = """
            select count(v) from Vocabulary v
            where v.id in (select i.id.vocabularyId from CustomVocabularyListItem i where i.id.listId = :listId)
              and (v.createdBy is null or v.createdBy = :userId) and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE
            """)
    Page<Vocabulary> findInList(
            @Param("listId") Long listId,
            @Param("userId") Long userId,
            Pageable pageable);

    /** Every word of a topic the user can see: what a game round on that topic is dealt from. */
    @Query("select v from Vocabulary v where v.topicId = :topicId and (v.createdBy is null or v.createdBy = :userId) and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE")
    List<Vocabulary> findAllVisibleInTopic(@Param("topicId") Long topicId, @Param("userId") Long userId);

    /** Every word of a personal list the user can see: what a game round on that list is dealt from. */
    @Query("""
            select v from Vocabulary v
            where v.id in (select i.id.vocabularyId from CustomVocabularyListItem i where i.id.listId = :listId)
              and (v.createdBy is null or v.createdBy = :userId) and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE
            """)
    List<Vocabulary> findAllVisibleInList(@Param("listId") Long listId, @Param("userId") Long userId);

    /** Every system word of a topic: what a game round is dealt from when the player chose no topic or list. */
    @Query("select v from Vocabulary v where v.createdBy is null and v.topicId is not null and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE")
    List<Vocabulary> findAllSystemWordsInTopics();

    /** Words of a personal list the user has not started, easiest first, like {@link #findNewInTopic}. */
    @Query("""
            select v from Vocabulary v
            where v.id in (select i.id.vocabularyId from CustomVocabularyListItem i where i.id.listId = :listId)
              and (v.createdBy is null or v.createdBy = :userId) and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE
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

    // --- Admin area (docs/api/admin.md, scenarios 19–22) ------------------------------------------------------------

    /**
     * The visible system words matching the optional filters, in the order of {@link #search}. {@code missing} is
     * AUDIO, EXAMPLE or IMAGE (or null): only the words without that content.
     */
    @Query(value = """
            select v from Vocabulary v
            where v.createdBy is null
              and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE
              and (:topicId is null or v.topicId = :topicId)
              and (:level is null or v.difficultyLevel = :level)
              and (:pattern is null
                   or lower(v.word) like :pattern escape '!'
                   or lower(v.meaning) like :pattern escape '!')
              and (:missing is null
                   or (:missing = 'AUDIO' and (v.audioUrl is null or v.audioUrl = ''))
                   or (:missing = 'EXAMPLE' and (v.exampleSentence is null or v.exampleSentence = ''))
                   or (:missing = 'IMAGE' and (v.imageUrl is null or v.imageUrl = '')))
            order by v.difficultyLevel, lower(v.word), v.id
            """)
    Page<Vocabulary> searchSystemWords(
            @Param("topicId") Long topicId,
            @Param("level") CefrLevel level,
            @Param("pattern") String pattern,
            @Param("missing") String missing,
            Pageable pageable);

    /** Per topic: count, easiest and hardest level, and words without audio or example, of the visible system words. */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.AdminTopicCounts(
                v.topicId,
                count(v),
                min(v.difficultyLevel),
                max(v.difficultyLevel),
                sum(case when v.audioUrl is null or v.audioUrl = '' then 1 else 0 end),
                sum(case when v.exampleSentence is null or v.exampleSentence = '' then 1 else 0 end))
            from Vocabulary v
            where v.createdBy is null
              and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE
              and v.topicId is not null
            group by v.topicId
            """)
    List<AdminTopicCounts> countForAdmin();

    /** Per topic: how many learners have at least one of its words in their progress. */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.WordUsageCount(v.topicId, count(distinct uv.userId))
            from UserVocabulary uv
            join Vocabulary v on v.id = uv.vocabularyId
            where v.topicId is not null
            group by v.topicId
            """)
    List<WordUsageCount> countLearnersByTopic();

    /** Per word: how many learners have it in their progress (user_vocabulary). */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.WordUsageCount(uv.vocabularyId, count(uv))
            from UserVocabulary uv
            where uv.vocabularyId in :ids
            group by uv.vocabularyId
            """)
    List<WordUsageCount> countLearners(@Param("ids") Collection<Long> ids);

    /** Per word: how many personal lists hold it. */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.WordUsageCount(i.id.vocabularyId, count(i))
            from CustomVocabularyListItem i
            where i.id.vocabularyId in :ids
            group by i.id.vocabularyId
            """)
    List<WordUsageCount> countLists(@Param("ids") Collection<Long> ids);

    /** Every word filed under a topic, hidden ones and learners' own included: a topic with any cannot be deleted. */
    long countByTopicId(Long topicId);

    /**
     * Whether the topic already has another visible system word with this text, ignoring case (scenarios 19 and 20).
     *
     * @param excludedId the word being edited, or -1 when adding one
     */
    @Query("""
            select count(v) > 0 from Vocabulary v
            where v.createdBy is null
              and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE
              and v.topicId = :topicId
              and lower(v.word) = lower(:word)
              and v.id <> :excludedId
            """)
    boolean existsSystemWordInTopic(
            @Param("topicId") Long topicId,
            @Param("word") String word,
            @Param("excludedId") Long excludedId);

    /** The visible system words of a topic: the wrong choices of a test question made from one of them. */
    @Query("""
            select v from Vocabulary v
            where v.createdBy is null
              and v.status = com.example.datn.modules.vocabulary.enums.VocabularyStatus.VISIBLE
              and v.topicId = :topicId
            order by v.id
            """)
    List<Vocabulary> findSystemWordsInTopic(@Param("topicId") Long topicId);
}
