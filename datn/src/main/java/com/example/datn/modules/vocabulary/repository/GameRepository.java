package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameRepository extends JpaRepository<Game, Long> {
}
