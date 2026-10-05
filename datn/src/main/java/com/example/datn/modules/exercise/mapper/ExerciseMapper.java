package com.example.datn.modules.exercise.mapper;

import com.example.datn.modules.exercise.dto.response.ExerciseDetailResponse;
import com.example.datn.modules.exercise.entity.ExerciseLesson;
import com.example.datn.modules.exercise.entity.ExerciseQuestion;
import com.example.datn.modules.exercise.entity.ListeningPassage;
import com.example.datn.modules.exercise.entity.ListeningSegment;
import com.example.datn.modules.exercise.entity.PronunciationItem;
import com.example.datn.modules.exercise.entity.QuestionOption;
import com.example.datn.modules.exercise.audio.R2AudioProperties;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ExerciseMapper {
    private final R2AudioProperties r2AudioProperties;

    public ExerciseMapper(R2AudioProperties r2AudioProperties) {
        this.r2AudioProperties = r2AudioProperties;
    }

    public ExerciseDetailResponse toDetail(
            ExerciseLesson lesson,
            List<ExerciseQuestion> questions,
            Map<Long, List<QuestionOption>> options,
            ListeningPassage passage,
            List<ListeningSegment> segments,
            List<PronunciationItem> pronunciationItems) {
        return new ExerciseDetailResponse(
                lesson.getId(), lesson.getSkill(), lesson.getTitle(), lesson.getDescription(), lesson.getTopic(),
                lesson.getCefrLevel(), lesson.getDifficulty(), lesson.getEstimatedMinutes(),
                questions.stream().map(question -> new ExerciseDetailResponse.Question(
                        question.getId(), question.getQuestionType(), question.getPrompt(), question.getHintText(),
                        question.getPoints(), options.getOrDefault(question.getId(), List.of()).stream()
                                .map(option -> new ExerciseDetailResponse.Option(
                                        option.getId(), option.getOptionKey(), option.getOptionText()))
                .toList())).toList(),
                passage == null ? null : new ExerciseDetailResponse.Passage(
                        passage.getTitle(), resolveListeningAudioUrl(passage.getAudioUri()), passage.getDurationMs(), segments.stream()
                                .map(segment -> new ExerciseDetailResponse.Segment(
                                        segment.getId(), segment.getOrder(), segment.getStartMs(), segment.getEndMs(),
                                        segment.getSpeakerLabel(), segment.getTranscriptEn()))
                                .toList()),
                pronunciationItems.stream().map(item -> new ExerciseDetailResponse.PronunciationItem(
                        item.getId(), item.getReferenceText(), item.getIpa(), item.getReferenceAudioUri(), item.getNotes()))
                        .toList());
    }

    private String resolveListeningAudioUrl(String audioUri) {
        if (audioUri == null || audioUri.isBlank()
                || audioUri.startsWith("http://") || audioUri.startsWith("https://")) {
            return audioUri;
        }

        String objectKey = audioUri.replaceFirst("^/+", "");
        if (r2AudioProperties.enabled()) {
            return "/media/r2/" + objectKey;
        }
        if (!r2AudioProperties.publicBaseUrl().isBlank()) {
            return r2AudioProperties.publicBaseUrl() + "/" + objectKey;
        }
        return audioUri;
    }
}
