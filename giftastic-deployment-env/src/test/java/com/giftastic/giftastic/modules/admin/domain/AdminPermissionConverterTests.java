package com.giftastic.giftastic.modules.admin.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class AdminPermissionConverterTests {

    private final AdminPermissionConverter converter = new AdminPermissionConverter();

    @Test
    void unknownStoredPermissionsAreIgnoredSafely() {
        assertThat(converter.convertToEntityAttribute("MANAGE_PRODUCTS")).isNull();
        assertThat(converter.convertToEntityAttribute("SUPER_ADMIN")).isEqualTo(AdminPermission.SUPER_ADMIN);
    }

    @Test
    void adminExposesOnlyCurrentPermissionValues() {
        Set<AdminPermission> storedPermissions = new HashSet<>();
        storedPermissions.add(null);
        storedPermissions.add(AdminPermission.VIEW_USERS);
        Admin admin = new Admin(UUID.randomUUID(), storedPermissions);

        assertThat(admin.getPermissions()).containsExactly(AdminPermission.VIEW_USERS);
        admin.grantPermission(AdminPermission.MANAGE_USERS);
        assertThat(admin.getPermissions()).containsExactlyInAnyOrder(
                AdminPermission.VIEW_USERS,
                AdminPermission.MANAGE_USERS
        );
    }
}
