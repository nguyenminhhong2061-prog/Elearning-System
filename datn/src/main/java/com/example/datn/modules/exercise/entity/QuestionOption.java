package com.example.datn.modules.exercise.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "question_options")
public class QuestionOption {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long questionId;
    @Column(nullable = false, length = 10)
    private String optionKey;
    @Column(nullable = false, length = 500)
    private String optionText;
    @Column(name = "is_correct", nullable = false)
    private boolean correct;
    @Column(nullable = false)
    private int sortOrder;

    protected QuestionOption() {}

    public Long getId() { return id; }
    public Long getQuestionId() { return questionId; }
    public String getOptionKey() { return optionKey; }
    public String getOptionText() { return optionText; }
    public boolean isCorrect() { return correct; }
    public int getSortOrder() { return sortOrder; }
}
