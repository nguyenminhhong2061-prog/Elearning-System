package com.example.datn.modules.test.entity;

import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestStatus;
import com.example.datn.modules.test.enums.TestType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** A test (tests): periodic or comprehensive. Questions hang off it via test_id. */
@Entity
@Table(name = "tests")
public class Test {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TestType type;

    @Convert(converter = TestSkillConverter.class)
    @Column(length = 100)
    private TestSkill skill;

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "end_date")
    private Instant endDate;

    // Whether learners may see the test at all; its dates then say when.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TestStatus status = TestStatus.VISIBLE;

    // What the test covers in the admin's own words ("Từ vựng và ngữ pháp"); skill above is one skill of the enum.
    @Column(name = "skill_text", length = 200)
    private String skillText;

    @Column(columnDefinition = "TEXT")
    private String instruction;

    // The test this one was duplicated from; null for a test written from scratch.
    @Column(name = "duplicated_from_id")
    private Long duplicatedFromId;

    protected Test() {
    }

    /** A test learners see as soon as its dates allow. */
    public Test(String title, TestType type, TestSkill skill, Instant startDate, Instant endDate) {
        this.title = title;
        this.type = type;
        this.skill = skill;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    /** A test as the admin editor creates it: shown or not, as the admin chose. */
    public Test(String title, TestType type, TestSkill skill, Instant startDate, Instant endDate, TestStatus status) {
        this(title, type, skill, startDate, endDate);
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public TestType getType() {
        return type;
    }

    public TestSkill getSkill() {
        return skill;
    }

    public Instant getStartDate() {
        return startDate;
    }

    public Instant getEndDate() {
        return endDate;
    }

    public TestStatus getStatus() {
        return status;
    }

    public String getSkillText() {
        return skillText;
    }

    public String getInstruction() {
        return instruction;
    }

    public Long getDuplicatedFromId() {
        return duplicatedFromId;
    }

    public void rename(String title) {
        this.title = title;
    }

    public void schedule(Instant startDate, Instant endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public void setStatus(TestStatus status) {
        this.status = status;
    }

    /** Sets what the test covers and how to take it, both in the admin's own words. */
    public void describe(String skillText, String instruction) {
        this.skillText = skillText;
        this.instruction = instruction;
    }

    public void duplicatedFrom(Long testId) {
        this.duplicatedFromId = testId;
    }
}
