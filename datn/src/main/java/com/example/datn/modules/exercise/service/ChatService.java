package com.example.datn.modules.exercise.service;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.exercise.dto.request.CreateChatSessionRequest;
import com.example.datn.modules.exercise.dto.request.SendChatMessageRequest;
import com.example.datn.modules.exercise.dto.response.ChatMessageResponse;
import com.example.datn.modules.exercise.dto.response.ChatPageResponse;
import com.example.datn.modules.exercise.dto.response.ChatSessionResponse;
import com.example.datn.modules.exercise.entity.ChatMessage;
import com.example.datn.modules.exercise.entity.ChatMessageSource;
import com.example.datn.modules.exercise.entity.ChatSession;
import com.example.datn.modules.exercise.entity.ExerciseAttempt;
import com.example.datn.modules.exercise.entity.ExerciseLesson;
import com.example.datn.modules.exercise.entity.ExerciseQuestion;
import com.example.datn.modules.exercise.entity.KnowledgeChunk;
import com.example.datn.modules.exercise.entity.PronunciationAttempt;
import com.example.datn.modules.exercise.entity.PronunciationItem;
import com.example.datn.modules.exercise.entity.QuestionOption;
import com.example.datn.modules.exercise.entity.QuestionResponse;
import com.example.datn.modules.exercise.enums.ChatRole;
import com.example.datn.modules.exercise.exception.AttemptNotFoundException;
import com.example.datn.modules.exercise.exception.ChatSessionNotFoundException;
import com.example.datn.modules.exercise.exception.ExerciseNotFoundException;
import com.example.datn.modules.exercise.exception.InvalidExerciseRequestException;
import com.example.datn.modules.exercise.mapper.ChatMapper;
import com.example.datn.modules.exercise.repository.ChatMessageRepository;
import com.example.datn.modules.exercise.repository.ChatMessageSourceRepository;
import com.example.datn.modules.exercise.repository.ChatSessionRepository;
import com.example.datn.modules.exercise.repository.ExerciseAttemptRepository;
import com.example.datn.modules.exercise.repository.ExerciseLessonRepository;
import com.example.datn.modules.exercise.repository.ExerciseQuestionRepository;
import com.example.datn.modules.exercise.repository.KnowledgeChunkRepository;
import com.example.datn.modules.exercise.repository.PronunciationAttemptRepository;
import com.example.datn.modules.exercise.repository.PronunciationItemRepository;
import com.example.datn.modules.exercise.repository.QuestionAcceptedAnswerRepository;
import com.example.datn.modules.exercise.repository.QuestionOptionRepository;
import com.example.datn.modules.exercise.repository.QuestionResponseRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ChatService {
    private static final int HISTORY_LIMIT = 8;
    private static final int HISTORY_PAGE_SIZE = 20;
    private static final int MESSAGE_PAGE_SIZE = 50;
    private static final String SYSTEM_PROMPT = """
            Bạn là trợ lý học tiếng Anh của LinguaStep. Trả lời bằng tiếng Việt, ví dụ bằng tiếng Anh.
            Trả lời bằng HTML fragment gọn, không dùng Markdown, không dùng dấu ``` hay tài liệu HTML đầy đủ.
            Chỉ dùng các thẻ <p>, <strong>, <em>, <ul>, <ol>, <li>, <br>, <code>; không dùng thuộc tính, liên kết, ảnh hoặc CSS.
            Ưu tiên 1-2 đoạn ngắn hoặc tối đa 3 gạch đầu dòng, không thêm tiêu đề nếu không cần.
            Giải thích ngắn gọn, đúng trình độ người học.
            Nếu ngữ cảnh ghi rằng người học CHƯA trả lời, chỉ gợi ý cách suy nghĩ và tuyệt đối không tiết lộ đáp án.
            Nếu đã trả lời, có thể phân tích đáp án đúng/sai và đưa thêm ví dụ.
            Không bịa nội dung bài học. Khi dữ liệu không đủ, nói rõ giới hạn và hỏi lại người học.
            """;

    private final ChatSessionRepository sessions;
    private final ChatMessageRepository messages;
    private final ChatMessageSourceRepository messageSources;
    private final KnowledgeChunkRepository chunks;
    private final ExerciseLessonRepository lessons;
    private final ExerciseQuestionRepository questions;
    private final QuestionOptionRepository options;
    private final QuestionAcceptedAnswerRepository acceptedAnswers;
    private final ExerciseAttemptRepository attempts;
    private final QuestionResponseRepository responses;
    private final PronunciationItemRepository pronunciationItems;
    private final PronunciationAttemptRepository pronunciationAttempts;
    private final ChatProvider provider;
    private final ChatMapper mapper;
    private final CurrentUser currentUser;

    public ChatService(ChatSessionRepository sessions, ChatMessageRepository messages,
            ChatMessageSourceRepository messageSources, KnowledgeChunkRepository chunks,
            ExerciseLessonRepository lessons, ExerciseQuestionRepository questions,
            QuestionOptionRepository options, QuestionAcceptedAnswerRepository acceptedAnswers,
            ExerciseAttemptRepository attempts, QuestionResponseRepository responses,
            PronunciationItemRepository pronunciationItems, PronunciationAttemptRepository pronunciationAttempts,
            ChatProvider provider, ChatMapper mapper, CurrentUser currentUser) {
        this.sessions = sessions; this.messages = messages; this.messageSources = messageSources; this.chunks = chunks;
        this.lessons = lessons; this.questions = questions; this.options = options; this.acceptedAnswers = acceptedAnswers;
        this.attempts = attempts; this.responses = responses; this.pronunciationItems = pronunciationItems;
        this.pronunciationAttempts = pronunciationAttempts; this.provider = provider; this.mapper = mapper;
        this.currentUser = currentUser;
    }

    public ChatSessionResponse create(CreateChatSessionRequest request) {
        Long lessonId = request == null ? null : request.lessonId();
        Long questionId = request == null ? null : request.questionId();
        ExerciseQuestion question = questionId == null ? null : requireQuestion(questionId);
        if (question != null) {
            if (lessonId != null && !question.getLessonId().equals(lessonId)) {
                throw new InvalidExerciseRequestException("Question does not belong to the selected lesson");
            }
            lessonId = question.getLessonId();
        }
        Long resolvedLessonId = lessonId;
        ExerciseLesson lesson = resolvedLessonId == null ? null : lessons.findById(resolvedLessonId)
                .orElseThrow(() -> new ExerciseNotFoundException(resolvedLessonId));
        String title = lesson == null ? "Hỏi đáp chung" : lesson.getTitle();
        return mapper.toResponse(sessions.save(new ChatSession(
                currentUser.id(), resolvedLessonId, questionId, title, Instant.now())));
    }

    @Transactional(readOnly = true)
    public ChatPageResponse<ChatSessionResponse> history(int page) {
        if (page < 0) throw new InvalidExerciseRequestException("Page must not be negative");
        return ChatPageResponse.from(sessions.findAllByUserIdOrderByUpdatedAtDescIdDesc(currentUser.id(),
                PageRequest.of(page, HISTORY_PAGE_SIZE)).map(mapper::toResponse));
    }

    @Transactional(readOnly = true)
    public ChatPageResponse<ChatMessageResponse> messages(Long sessionId, int page) {
        if (page < 0) throw new InvalidExerciseRequestException("Page must not be negative");
        sessions.findByIdAndUserId(sessionId, currentUser.id())
                .orElseThrow(() -> new ChatSessionNotFoundException(sessionId));
        Page<ChatMessage> result = messages.findPageBySessionIdOrderByCreatedAtDescIdDesc(
                sessionId, PageRequest.of(page, MESSAGE_PAGE_SIZE));
        List<Long> messageIds = result.getContent().stream().map(ChatMessage::getId).toList();
        Map<Long, KnowledgeChunk> sourceById = new LinkedHashMap<>();
        Map<Long, List<KnowledgeChunk>> sourcesByMessage = new LinkedHashMap<>();
        if (!messageIds.isEmpty()) {
            List<ChatMessageSource> links = messageSources.findAllByMessageIds(messageIds);
            List<Long> chunkIds = links.stream().map(link -> link.getId().getKnowledgeChunkId()).distinct().toList();
            chunks.findAllById(chunkIds).forEach(chunk -> sourceById.put(chunk.getId(), chunk));
            links.forEach(link -> {
                KnowledgeChunk chunk = sourceById.get(link.getId().getKnowledgeChunkId());
                if (chunk != null) sourcesByMessage.computeIfAbsent(link.getId().getMessageId(), id -> new ArrayList<>())
                        .add(chunk);
            });
        }
        return ChatPageResponse.from(result.map(message -> mapper.toResponse(message,
                sourcesByMessage.getOrDefault(message.getId(), List.of()))));
    }

    public ChatMessageResponse send(Long sessionId, SendChatMessageRequest request) {
        ChatSession session = sessions.findByIdAndUserId(sessionId, currentUser.id())
                .orElseThrow(() -> new ChatSessionNotFoundException(sessionId));
        String content = request.content().strip();
        Context context = buildContext(session, request);
        List<ChatProvider.PromptMessage> prompt = new ArrayList<>();
        prompt.add(new ChatProvider.PromptMessage("system", SYSTEM_PROMPT + "\n\n" + context.text()));
        List<ChatMessage> history = new ArrayList<>(messages.findAllBySessionIdOrderByCreatedAtDescIdDesc(
                sessionId, PageRequest.of(0, HISTORY_LIMIT)));
        Collections.reverse(history);
        history.forEach(message -> prompt.add(new ChatProvider.PromptMessage(
                message.getRole() == ChatRole.ASSISTANT ? "assistant" : "user", message.getContent())));
        prompt.add(new ChatProvider.PromptMessage("user", content));

        Instant now = Instant.now();
        messages.save(new ChatMessage(sessionId, ChatRole.USER, content, null, null, null, null, now));
        ChatProvider.Reply reply = provider.reply(prompt);
        ChatMessage assistant = messages.save(new ChatMessage(sessionId, ChatRole.ASSISTANT, reply.content(),
                reply.provider(), reply.model(), reply.promptTokens(), reply.completionTokens(), Instant.now()));
        context.sources().forEach(source -> messageSources.save(new ChatMessageSource(assistant.getId(), source.getId())));
        session.touch(Instant.now());
        return mapper.toResponse(assistant, context.sources());
    }

    private Context buildContext(ChatSession session, SendChatMessageRequest request) {
        Long questionId = request.questionId() != null ? request.questionId() : session.getQuestionId();
        ExerciseQuestion question = questionId == null ? null : requireQuestion(questionId);
        if (question != null && session.getLessonId() != null
                && !session.getLessonId().equals(question.getLessonId())) {
            throw new InvalidExerciseRequestException("Question does not belong to the chat session lesson");
        }
        Long lessonId = question != null ? question.getLessonId() : session.getLessonId();
        ExerciseLesson lesson = lessonId == null ? null : lessons.findById(lessonId)
                .orElseThrow(() -> new ExerciseNotFoundException(lessonId));

        ExerciseAttempt attempt = null;
        if (request.attemptId() != null) {
            attempt = attempts.findById(request.attemptId())
                    .filter(item -> item.getUserId().equals(currentUser.id()))
                    .orElseThrow(() -> new AttemptNotFoundException(request.attemptId()));
            if (lessonId != null && !attempt.getLessonId().equals(lessonId)) {
                throw new InvalidExerciseRequestException("Attempt does not belong to the current lesson");
            }
        }

        QuestionResponse learnerResponse = attempt == null || question == null ? null
                : responses.findByAttemptIdAndQuestionId(attempt.getId(), question.getId()).orElse(null);
        StringBuilder text = new StringBuilder("NGỮ CẢNH ĐÁNG TIN CẬY TỪ DATABASE:\n");
        if (lesson != null) {
            text.append("Bài: ").append(lesson.getTitle()).append("; kỹ năng: ").append(lesson.getSkill())
                    .append("; CEFR: ").append(lesson.getCefrLevel()).append(".\n");
        }
        if (question != null) appendQuestion(text, question, learnerResponse);
        if (request.pronunciationItemId() != null) appendPronunciation(text, request.pronunciationItemId(), attempt);

        Map<Long, KnowledgeChunk> relevant = new LinkedHashMap<>();
        if (questionId != null && learnerResponse != null) chunks.findTop5ByQuestionIdOrderByIdAsc(questionId)
                .forEach(chunk -> relevant.put(chunk.getId(), chunk));
        if (lessonId != null) chunks.findTop5ByLessonIdAndQuestionIdIsNullOrderByIdAsc(lessonId)
                .forEach(chunk -> relevant.putIfAbsent(chunk.getId(), chunk));
        relevant.values().forEach(chunk -> text.append("Nguồn nội bộ [")
                .append(chunk.getSourceTitle() == null ? chunk.getSourceKey() : chunk.getSourceTitle())
                .append("]: ").append(chunk.getContent()).append("\n"));
        return new Context(text.toString(), List.copyOf(relevant.values()));
    }

    private void appendQuestion(StringBuilder text, ExerciseQuestion question, QuestionResponse learnerResponse) {
        text.append("Câu hỏi: ").append(question.getPrompt()).append("\n");
        List<QuestionOption> questionOptions = options.findAllByQuestionIdInOrderBySortOrderAscIdAsc(List.of(question.getId()));
        if (!questionOptions.isEmpty()) {
            text.append("Lựa chọn: ");
            questionOptions.forEach(option -> text.append(option.getOptionKey()).append(". ")
                    .append(option.getOptionText()).append("; "));
            text.append("\n");
        }
        if (learnerResponse == null) {
            text.append("Trạng thái: người học CHƯA trả lời; không được tiết lộ đáp án.\n");
            return;
        }
        text.append("Trạng thái: người học ĐÃ trả lời; kết quả: ")
                .append(learnerResponse.isCorrect() ? "đúng" : "sai").append(".\n");
        if (learnerResponse.getSelectedOptionId() != null) {
            options.findById(learnerResponse.getSelectedOptionId())
                    .ifPresent(option -> text.append("Đáp án người học: ").append(option.getOptionText()).append(".\n"));
        } else {
            text.append("Đáp án người học: ").append(learnerResponse.getEnteredAnswer()).append(".\n");
        }
        options.findFirstByQuestionIdAndCorrectTrueOrderBySortOrderAscIdAsc(question.getId())
                .ifPresent(option -> text.append("Đáp án đúng: ").append(option.getOptionText()).append(".\n"));
        acceptedAnswers.findFirstByQuestionIdAndPrimaryTrueOrderByIdAsc(question.getId())
                .ifPresent(answer -> text.append("Đáp án đúng: ").append(answer.getAnswerText()).append(".\n"));
        if (question.getExplanation() != null) text.append("Giải thích chuẩn: ").append(question.getExplanation()).append("\n");
    }

    private void appendPronunciation(StringBuilder text, Long itemId, ExerciseAttempt attempt) {
        PronunciationItem item = pronunciationItems.findById(itemId)
                .orElseThrow(() -> new InvalidExerciseRequestException("Pronunciation item was not found"));
        if (attempt != null && !item.getLessonId().equals(attempt.getLessonId())) {
            throw new InvalidExerciseRequestException("Pronunciation item does not belong to the attempt lesson");
        }
        text.append("Mục phát âm: ").append(item.getReferenceText()).append("; IPA: ").append(item.getIpa()).append(".\n");
        if (attempt != null) {
            pronunciationAttempts.findFirstByAttemptIdAndPronunciationItemIdOrderByAssessedAtDescIdDesc(
                    attempt.getId(), itemId).ifPresent(result -> text.append("Điểm phát âm gần nhất: ")
                    .append(result.getOverallScore()).append("/100.\n"));
        }
    }

    private ExerciseQuestion requireQuestion(Long id) {
        return questions.findById(id).orElseThrow(() -> new InvalidExerciseRequestException("Question was not found"));
    }

    private record Context(String text, List<KnowledgeChunk> sources) {}
}
