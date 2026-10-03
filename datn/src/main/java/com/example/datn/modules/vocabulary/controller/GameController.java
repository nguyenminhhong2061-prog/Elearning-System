package com.example.datn.modules.vocabulary.controller;

import com.example.datn.modules.vocabulary.dto.request.CheckGameAnswerRequest;
import com.example.datn.modules.vocabulary.dto.request.SubmitGameRequest;
import com.example.datn.modules.vocabulary.dto.response.CheckResponse;
import com.example.datn.modules.vocabulary.dto.response.GameResponse;
import com.example.datn.modules.vocabulary.dto.response.LeaderboardResponse;
import com.example.datn.modules.vocabulary.dto.response.PlayResponse;
import com.example.datn.modules.vocabulary.dto.response.SubmitGameResponse;
import com.example.datn.modules.vocabulary.enums.LeaderboardPeriod;
import com.example.datn.modules.vocabulary.service.GameService;
import com.example.datn.modules.vocabulary.service.LeaderboardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Vocabulary games and leaderboards (docs/api/games.md). */
@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;
    private final LeaderboardService leaderboardService;

    public GameController(GameService gameService, LeaderboardService leaderboardService) {
        this.gameService = gameService;
        this.leaderboardService = leaderboardService;
    }

    /** The games for the words of a topic or a personal list ({@code topicId}, {@code listId}); neither: every system word. */
    @GetMapping
    public List<GameResponse> findAll(
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) Long listId) {
        return gameService.findAll(topicId, listId);
    }

    @GetMapping("/{id}/play")
    public PlayResponse play(
            @PathVariable Long id,
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) Long listId) {
        return gameService.play(id, topicId, listId);
    }

    @PostMapping("/{id}/check")
    public CheckResponse check(@PathVariable Long id, @Valid @RequestBody CheckGameAnswerRequest request) {
        return gameService.check(id, request);
    }

    @PostMapping("/{id}/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public SubmitGameResponse submit(@PathVariable Long id, @Valid @RequestBody SubmitGameRequest request) {
        return gameService.submit(id, request);
    }

    /** {@code gameId} left out: the board of all games together. */
    @GetMapping("/leaderboard")
    public LeaderboardResponse leaderboard(
            @RequestParam(defaultValue = "WEEK") LeaderboardPeriod period,
            @RequestParam(required = false) Long gameId) {
        return leaderboardService.board(period, gameId);
    }
}
