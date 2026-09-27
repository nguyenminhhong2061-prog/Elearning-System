package com.example.datn.modules.test.service;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.enums.TestSkill;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

/**
 * Runs without any external service so the whole flow works end-to-end in development. It is a clearly-labelled
 * placeholder: speaking is graded by comparing the typed sentence with the reference sentence, free-form writing by a
 * word-count heuristic, and the roadmap by naming the weakest skill. A real provider replaces this bean.
 */
@Component
public class DeterministicTestAiGateway implements TestAiGateway {

    @Override
    public Optional<Integer> gradeSpeaking(TestQuestion question, String submittedText) {
        if (submittedText == null || submittedText.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(similarityScore(referenceSentence(question.getContent()), submittedText));
    }

    @Override
    public Optional<Integer> gradeWriting(TestQuestion question, String submittedText) {
        if (submittedText == null || submittedText.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(wordCountScore(submittedText));
    }

    @Override
    public String suggestRoadmap(CefrLevel level, Map<TestSkill, Integer> skills) {
        TestSkill weakest = skills.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
        String focus = weakest == null ? "cả bốn kỹ năng" : "kỹ năng " + skillName(weakest);
        return "Tập trung luyện " + focus + " 15 phút mỗi ngày. "
                + "Ôn tập từ vựng và bài tập ở trình độ " + level + " để chuẩn bị lên mức tiếp theo.";
    }

    /** The sentence the learner was asked to read, taken from between the first pair of quotes of the prompt. */
    private static String referenceSentence(String content) {
        int open = content.indexOf('"');
        int close = open < 0 ? -1 : content.indexOf('"', open + 1);
        if (open < 0 || close < 0) {
            return content;
        }
        return content.substring(open + 1, close);
    }

    /** Character-level similarity (1 - normalized Levenshtein distance), 0-100. */
    private static int similarityScore(String reference, String submitted) {
        String a = AnswerNormalizer.normalize(reference);
        String b = AnswerNormalizer.normalize(submitted);
        if (a.equals(b)) {
            return 100;
        }
        if (a.isEmpty() || b.isEmpty()) {
            return 0;
        }
        int distance = levenshtein(a, b);
        int maxLength = Math.max(a.length(), b.length());
        return Math.round(100f * (1f - (float) distance / maxLength));
    }

    /** A demo heuristic: longer, more substantial writing scores higher. */
    private static int wordCountScore(String text) {
        int words = text.trim().split("\\s+").length;
        if (words < 5) {
            return 30;
        }
        if (words < 20) {
            return 50;
        }
        if (words < 50) {
            return 70;
        }
        if (words < 100) {
            return 85;
        }
        return 95;
    }

    private static int levenshtein(String a, String b) {
        int[] previous = new int[b.length() + 1];
        int[] current = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) {
            previous[j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            current[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                current[j] = Math.min(
                        Math.min(current[j - 1] + 1, previous[j] + 1),
                        previous[j - 1] + cost);
            }
            int[] swap = previous;
            previous = current;
            current = swap;
        }
        return previous[b.length()];
    }

    private static String skillName(TestSkill skill) {
        return switch (skill) {
            case LISTENING -> "Nghe";
            case SPEAKING -> "Nói";
            case READING -> "Đọc";
            case WRITING -> "Viết";
        };
    }
}
