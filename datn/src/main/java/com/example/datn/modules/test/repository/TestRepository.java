package com.example.datn.modules.test.repository;

import com.example.datn.modules.test.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface TestRepository extends JpaRepository<Test, Long> {

    /** Tests whose window is open now: no start bound, or started; and no end bound, or not yet ended. */
    @Query("""
            select t from Test t
            where (t.startDate is null or t.startDate <= :now)
              and (t.endDate is null or t.endDate >= :now)
            order by t.id asc
            """)
    List<Test> findOpen(@Param("now") Instant now);
}
