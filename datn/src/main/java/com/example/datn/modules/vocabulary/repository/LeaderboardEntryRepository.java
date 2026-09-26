package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.LeaderboardEntry;
import com.example.datn.modules.vocabulary.enums.LeaderboardPeriod;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/** A null {@code gameId} means the board of all games together, whose rows have a null game_id. */
public interface LeaderboardEntryRepository extends JpaRepository<LeaderboardEntry, Long> {

    /**
     * Removes every board of one period before it is rebuilt. The unique constraint on (game_id, period_type,
     * period_start, user_id) cannot guard the all-games board, since PostgreSQL treats NULL game ids as distinct.
     */
    @Modifying
    @Query("delete from LeaderboardEntry l where l.periodType = :period and l.periodStart = :start")
    void deletePeriod(@Param("period") LeaderboardPeriod period, @Param("start") LocalDate start);

    @Query("""
            select l from LeaderboardEntry l
            where ((:gameId is null and l.gameId is null) or l.gameId = :gameId)
              and l.periodType = :period
              and l.periodStart = :start
            order by l.rank, l.userId
            """)
    List<LeaderboardEntry> findBoard(
            @Param("gameId") Long gameId,
            @Param("period") LeaderboardPeriod period,
            @Param("start") LocalDate start,
            Pageable pageable);

    @Query("""
            select l from LeaderboardEntry l
            where ((:gameId is null and l.gameId is null) or l.gameId = :gameId)
              and l.periodType = :period
              and l.periodStart = :start
              and l.userId = :userId
            """)
    Optional<LeaderboardEntry> findEntry(
            @Param("gameId") Long gameId,
            @Param("period") LeaderboardPeriod period,
            @Param("start") LocalDate start,
            @Param("userId") Long userId);
}
