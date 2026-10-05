package com.example.datn.modules.vocabulary.exception;

/** A topic that still has words cannot be deleted; the admin moves or deletes them first (scenario 22, branch 2b). */
public class TopicHasWordsException extends RuntimeException {

    public TopicHasWordsException(long wordCount) {
        super("Topic still has " + wordCount + " words");
    }
}
