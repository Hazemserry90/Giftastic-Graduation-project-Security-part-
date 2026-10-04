package com.giftastic.giftastic.modules.admin.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AdminPermissionConverter implements AttributeConverter<AdminPermission, String> {

    @Override
    public String convertToDatabaseColumn(AdminPermission permission) {
        return permission == null ? null : permission.name();
    }

    @Override
    public AdminPermission convertToEntityAttribute(String value) {
        if (value == null) return null;
        try {
            return AdminPermission.valueOf(value);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}
