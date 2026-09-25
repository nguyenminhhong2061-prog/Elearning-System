package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

    /** A player's best score in each game they played, in one grouped query. */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.GameCounts(s.gameId, cast(max(s.score) as Long))
            from GameSession s
            where s.userId = :userId
            group by s.gameId
            """)
    List<GameCounts> bestScores(@Param("userId") Long userId);

    /** A player's best score in one game, or null before their first round. */
    @Query("select max(s.score) from GameSession s where s.userId = :userId and s.gameId = :gameId")
    Integer bestScore(@Param("userId") Long userId, @Param("gameId") Long gameId);

    /** Every player's total score per game for the rounds played in [from, to), and the time of their last round. */
    @Query("""
            select new com.example.datn.modules.vocabulary.repository.ScoreTotal(
                s.gameId, s.userId, sum(s.score), max(s.playedAt))
            from GameSession s
            where s.playedAt >= :from and s.playedAt < :to
            group by s.gameId, s.userId
            """)
    List<ScoreTotal> totalsBetween(@Param("from") Instant from, @Param("to") Instant to);
}
