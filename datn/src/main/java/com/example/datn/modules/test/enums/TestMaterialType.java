package com.example.datn.modules.test.enums;

/**
 * The kind of a passage as the admin editor names it ("material" in docs/api/admin.md): a recording to listen to or a
 * text to read. test_passages has no such column: a passage with a recording is a listening one.
 */
public enum TestMaterialType {
    LISTENING,
    READING
}
