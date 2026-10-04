package com.giftastic.giftastic.modules.user.domain;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED) // Required by JPA
public class User {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private boolean isBanned;

    @Column(name = "requested_admin", nullable = false, columnDefinition = "BOOLEAN DEFAULT false")
    private boolean requestedAdmin = false;

    private String fullName;
    private String phoneNumber;
    private String instapayRefundPhoneNumber;
    private String instapayRefundName;
    private java.time.LocalDate birthday;

    @jakarta.persistence.ElementCollection
    @jakarta.persistence.CollectionTable(name = "user_addresses", joinColumns = @jakarta.persistence.JoinColumn(name = "user_id"))
    private java.util.List<Address> addresses = new java.util.ArrayList<>();

    // Factory method to maintain your "New User" logic
    public static User create(String email, String passwordHash) {
        return new User(UUID.randomUUID(), email, passwordHash, false, false, null, null, null, null, null, new java.util.ArrayList<>());
    }

    public void banUser() {
        this.isBanned = true;
    }

    public void unban() {
        this.isBanned = false;
    }

    public void requestAdmin() {
        this.requestedAdmin = true;
    }

    public void updateProfile(String fullName, String phoneNumber, java.time.LocalDate birthday) {
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.birthday = birthday;
    }

    public void updateInstapayRefundDetails(String phoneNumber, String name) {
        this.instapayRefundPhoneNumber = phoneNumber;
        this.instapayRefundName = name;
    }

    public void setAddresses(java.util.List<Address> addresses) {
        this.addresses = new java.util.ArrayList<>(addresses);
    }
}
