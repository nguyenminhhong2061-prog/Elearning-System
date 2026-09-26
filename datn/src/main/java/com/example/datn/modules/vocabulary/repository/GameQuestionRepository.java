package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.GameQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface GameQuestionRepository extends JpaRepository<GameQuestion, Long> {

    /** The size of every game's question bank, in one grouped query. */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.GameCounts(q.gameId, count(q))
            from GameQuestion q
            group by q.gameId
            """)
    List<GameCounts> countByGame();
}
