package com.example.datn.common.persistence;

import jakarta.persistence.AttributeConverter;

import java.util.Locale;

/**
 * Stores an enum as its lower-case name. The database schema uses VARCHAR + CHECK constraints with
 * lower-case values (for example 'learner', 'active'), while {@code @Enumerated(EnumType.STRING)} would
 * write the upper-case constant name and be rejected by the CHECK constraint.
 *
 * Extend it with a no-arg subclass annotated with {@code @Converter} and reference that subclass from
 * the entity field with {@code @Convert}.
 */
public abstract class LowercaseEnumConverter<E extends Enum<E>> implements AttributeConverter<E, String> {

    private final Class<E> enumType;

    protected LowercaseEnumConverter(Class<E> enumType) {
        this.enumType = enumType;
    }

    @Override
    public String convertToDatabaseColumn(E attribute) {
        return attribute == null ? null : attribute.name().toLowerCase(Locale.ROOT);
    }

    @Override
    public E convertToEntityAttribute(String dbData) {
        return dbData == null ? null : Enum.valueOf(enumType, dbData.toUpperCase(Locale.ROOT));
    }
}
