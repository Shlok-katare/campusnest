package com.campusnest.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Stores a short list of strings in a single text column, one item per line. */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final String SEPARATOR = "\n";

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return "";
        }
        return String.join(SEPARATOR, attribute);
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return new ArrayList<>();
        }
        return new ArrayList<>(Arrays.asList(dbData.split(SEPARATOR)));
    }
}
