package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.GameQuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface GameQuestionOptionRepository extends JpaRepository<GameQuestionOption, Long> {

    List<GameQuestionOption> findAllByGameQuestionIdIn(Collection<Long> gameQuestionIds);

    /** The right option of every question in a game's bank (one per question), used to draw a round. */
    @Query("""
            select o from GameQuestionOption o
            where o.correct = true
              and o.gameQuestionId in (select q.id from GameQuestion q where q.gameId = :gameId)
            """)
    List<GameQuestionOption> findCorrectInGame(@Param("gameId") Long gameId);
}
