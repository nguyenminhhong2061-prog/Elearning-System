package com.example.datn.modules.vocabulary.service;

import com.example.datn.common.dto.PageResponse;
import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.vocabulary.dto.response.AdminTopicResponse;
import com.example.datn.modules.vocabulary.dto.response.AdminWordResponse;
import com.example.datn.modules.vocabulary.dto.response.WordQuestionResponse;
import com.example.datn.modules.vocabulary.dto.response.WordQuestionResponse.Option;
import com.example.datn.modules.vocabulary.entity.Topic;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.exception.NotEnoughDistractorsException;
import com.example.datn.modules.vocabulary.exception.VocabularyNotFoundException;
import com.example.datn.modules.vocabulary.repository.AdminTopicCounts;
import com.example.datn.modules.vocabulary.repository.TopicRepository;
import com.example.datn.modules.vocabulary.repository.VocabularyRepository;
import com.example.datn.modules.vocabulary.repository.WordUsageCount;
import com.example.datn.modules.vocabulary.service.WordUsageService.WordUsage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/** Reads of the admin vocabulary pages (docs/api/admin.md, scenarios 19–22, and step 6 of scenario 24). */
@Service
@Transactional(readOnly = true)
public class AdminVocabularyService {

    private static final int WRONG_CHOICES = 3;

    private final TopicRepository topicRepository;
    private final VocabularyRepository vocabularyRepository;
    private final WordUsageService usageService;

    public AdminVocabularyService(TopicRepository topicRepository, VocabularyRepository vocabularyRepository, WordUsageService usageService) {
        this.topicRepository = topicRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.usageService = usageService;
    }

    /** Every topic with the counts of its visible system words and of the learners studying it. */
    public List<AdminTopicResponse> topics() {
        Map<Long, AdminTopicCounts> counts = vocabularyRepository.countForAdmin().stream()
                .collect(Collectors.toMap(AdminTopicCounts::topicId, Function.identity()));
        Map<Long, Long> learners = vocabularyRepository.countLearnersByTopic().stream()
                .collect(Collectors.toMap(WordUsageCount::vocabularyId, WordUsageCount::count));
        return topicRepository.findAll(Sort.by("id")).stream()
                .map(topic -> toResponse(topic, counts.get(topic.getId()), learners.getOrDefault(topic.getId(), 0L)))
                .toList();
    }

    /**
     * One page of visible system words matching the filters, each with what uses it.
     *
     * @param missing AUDIO, EXAMPLE or IMAGE, or null
     */
    public PageResponse<AdminWordResponse> words(Long topicId, String q, CefrLevel level, String missing, int page, int size) {
        Page<Vocabulary> words = vocabularyRepository.searchSystemWords(
                topicId, level, VocabularyService.toLikePattern(q), missing, PageRequest.of(page, size));
        Map<Long, WordUsage> usage = usageService.usageOf(words.getContent().stream().map(Vocabulary::getId).toList());
        return PageResponse.from(words, word -> toResponse(word, usage.get(word.getId())));
    }

    /**
     * Scenario 24, step 6: a multiple-choice question made from a word, not saved. The blank replaces the word in its
     * example sentence, or the question asks for the word with that meaning; three other words of the topic, closest
     * by id so that the result is the same each time, are the wrong choices.
     */
    public WordQuestionResponse questionFrom(Long vocabularyId) {
        Vocabulary word = vocabularyRepository.findById(vocabularyId)
                .filter(candidate -> candidate.getCreatedBy() == null && !candidate.isHidden())
                .orElseThrow(() -> new VocabularyNotFoundException(vocabularyId));
        if (word.getTopicId() == null) {
            throw new NotEnoughDistractorsException(vocabularyId);
        }
        List<Vocabulary> wrong = vocabularyRepository.findSystemWordsInTopic(word.getTopicId()).stream()
                .filter(other -> !other.getId().equals(word.getId())
                        && !sameText(other.getWord(), word.getWord())
                        && !sameText(other.getMeaning(), word.getMeaning()))
                .sorted(Comparator.comparingLong((Vocabulary other) -> Math.abs(other.getId() - word.getId())).thenComparing(Vocabulary::getId))
                .limit(WRONG_CHOICES)
                .toList();
        if (wrong.size() < WRONG_CHOICES) {
            throw new NotEnoughDistractorsException(vocabularyId);
        }

        // The word as a whole word only: "art" must not blank the middle of "We start at nine".
        String example = word.getExampleSentence() == null ? "" : word.getExampleSentence();
        Matcher match = Pattern.compile("(?<![\\p{L}\\p{N}])" + Pattern.quote(word.getWord()) + "(?![\\p{L}\\p{N}])",
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE).matcher(example);
        int at = match.find() ? match.start() : -1;
        String content = at >= 0
                ? example.substring(0, at) + "___" + example.substring(match.end())
                : "Which word means “" + word.getMeaning() + "”?";
        // A blank that starts the sentence takes capitalised choices ("___ officers checked our bags" → "Customs").
        Function<String, String> shown = text -> at == 0 ? text.substring(0, 1).toUpperCase(Locale.ROOT) + text.substring(1) : text;

        List<Vocabulary> choices = new ArrayList<>(List.of(word));
        choices.addAll(wrong);
        List<Option> options = IntStream.range(0, choices.size()).boxed()
                .sorted(Comparator.comparingLong((Integer index) -> (index * 7 + word.getId()) % 5).thenComparing(Function.identity()))
                .map(index -> new Option(shown.apply(choices.get(index).getWord()), index == 0))
                .toList();
        return new WordQuestionResponse("READING", "MULTIPLE_CHOICE", 1, null, word.getId(), null, content, options, List.of());
    }

    private static boolean sameText(String a, String b) {
        return a.strip().equalsIgnoreCase(b.strip());
    }

    private static AdminTopicResponse toResponse(Topic topic, AdminTopicCounts counts, long learnerCount) {
        return new AdminTopicResponse(
                topic.getId(),
                topic.getName(),
                topic.getDescription(),
                topic.getImageUrl(),
                counts == null ? 0 : counts.wordCount(),
                counts == null ? null : counts.minLevel(),
                counts == null ? null : counts.maxLevel(),
                counts == null ? 0 : counts.missingAudioCount(),
                counts == null ? 0 : counts.missingExampleCount(),
                learnerCount,
                topic.getUpdatedAt());
    }

    private static AdminWordResponse toResponse(Vocabulary word, WordUsage usage) {
        return new AdminWordResponse(
                word.getId(),
                word.getTopicId(),
                word.getWord(),
                word.getPhonetic(),
                word.getMeaning(),
                word.getExampleSentence(),
                word.getAudioUrl(),
                word.getImageUrl(),
                word.getDifficultyLevel(),
                usage.learnerCount(),
                usage.listCount(),
                usage.questionCount(),
                usage.openTests(),
                word.getUpdatedAt());
    }
}
