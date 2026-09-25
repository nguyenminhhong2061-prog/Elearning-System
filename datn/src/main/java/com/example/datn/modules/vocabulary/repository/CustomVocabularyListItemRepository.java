package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.CustomVocabularyListItem;
import com.example.datn.modules.vocabulary.entity.CustomVocabularyListItemId;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface CustomVocabularyListItemRepository
        extends JpaRepository<CustomVocabularyListItem, CustomVocabularyListItemId> {

    /**
     * Word, learned and due counts of the given lists for their owner, in one grouped query. Only words the owner
     * can see are counted. Lists without words are absent from the result.
     */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.ListWordCounts(
                i.id.listId,
                count(v),
                sum(case when uv.status in :learned then 1 else 0 end),
                sum(case when uv.nextReviewAt <= :today then 1 else 0 end))
            from CustomVocabularyListItem i
            join Vocabulary v on v.id = i.id.vocabularyId
            left join UserVocabulary uv on uv.vocabularyId = v.id and uv.userId = :userId
            where i.id.listId in :listIds
              and (v.createdBy is null or v.createdBy = :userId)
            group by i.id.listId
            """)
    List<ListWordCounts> countByList(
            @Param("listIds") Collection<Long> listIds,
            @Param("userId") Long userId,
            @Param("learned") Collection<LearningStatus> learned,
            @Param("today") LocalDate today);

    /**
     * Removes every item of a list before the list itself. PostgreSQL would cascade, but doing it here keeps the
     * behaviour the same on every database (the H2 test schema has no foreign keys).
     */
    @Modifying
    @Query("delete from CustomVocabularyListItem i where i.id.listId = :listId")
    void deleteAllInList(@Param("listId") Long listId);
}
