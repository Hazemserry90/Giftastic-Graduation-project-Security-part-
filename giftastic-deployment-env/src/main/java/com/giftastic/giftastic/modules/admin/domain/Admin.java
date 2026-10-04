package com.giftastic.giftastic.modules.admin.domain;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Table(name = "admins")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED) // Required by JPA
public class Admin {

    @Id
    @NonNull
    private UUID userId; // The bridge to Identity Module

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "admin_permissions", joinColumns = @JoinColumn(name = "user_id"))
    @Convert(converter = AdminPermissionConverter.class)
    @Column(name = "permission")
    @NonNull
    private Set<AdminPermission> permissions = new HashSet<>();

    public Set<AdminPermission> getPermissions() {
        return permissions.stream()
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toUnmodifiableSet());
    }

    public void grantPermission(AdminPermission permission) {
        this.permissions.remove(null);
        this.permissions.add(permission);
    }

    public void revokePermission(AdminPermission permission) {
        this.permissions.remove(null);
        this.permissions.remove(permission);
    }

    public boolean hasPermission(AdminPermission permission) {
        return permissions.contains(permission) || permissions.contains(AdminPermission.SUPER_ADMIN);
    }
}
