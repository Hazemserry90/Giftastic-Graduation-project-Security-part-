package com.giftastic.giftastic.modules.user.service;  
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
  
import com.giftastic.giftastic.modules.user.domain.User;
import com.giftastic.giftastic.modules.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;  
@Service  
@RequiredArgsConstructor
@jakarta.transaction.Transactional
public class UserServiceImpl implements UserService {  
    private final UserRepository userRepository;  
    private final PasswordEncoder passwordEncoder;
    private final com.giftastic.giftastic.modules.vendor.repository.VendorRepository vendorRepository;
    private final com.giftastic.giftastic.modules.admin.repository.AdminRepository adminRepository;  
    @Override  
    public User registerUser(String email, String rawPassword) {  
        if (userRepository.findByEmail(email).isPresent()) {  
            throw new RuntimeException("Account with this email already exists.");  
        }  
        String hashed = passwordEncoder.encode(rawPassword);  
        User user = User.create(email, hashed);  
        return userRepository.save(user);  
    }  
    @Override  
    public Optional<User> findByEmail(String email) {  
        return userRepository.findByEmail(email);  
    } 
    @Override  
    public void banUser(UUID userId) {  
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));  
        user.banUser();  
        userRepository.save(user);  
    }  
    @Override  
    public void unbanUser(UUID userId) {  
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));  
        user.unban();  
        userRepository.save(user);  
    }  
    @Override  
    public void requestAdminRole(UUID userId) {  
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));  
        user.requestAdmin();  
        userRepository.save(user);  
    }

    @Override
    public User updateProfile(UUID userId, String fullName, String phoneNumber, java.time.LocalDate birthday) {
        User user = getById(userId);
        user.updateProfile(fullName, phoneNumber, birthday);
        return userRepository.save(user);
    }

    @Override
    public User updateInstapayRefundDetails(UUID userId, String instapayRefundPhoneNumber, String instapayRefundName) {
        User user = getById(userId);
        user.updateInstapayRefundDetails(instapayRefundPhoneNumber, instapayRefundName);
        return userRepository.save(user);
    }

    @Override
    public User updateAddresses(UUID userId, java.util.List<com.giftastic.giftastic.modules.user.domain.Address> addresses) {
        User user = getById(userId);
        user.setAddresses(addresses);
        return userRepository.save(user);
    }

    @Override
    public User getById(UUID userId) {
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public void deleteUser(UUID userId) {
        userRepository.deleteById(userId);
    }

    @Override
    public com.giftastic.giftastic.modules.user.dto.PublicUserProfileResponse getPublicProfile(UUID userId) {
        User user = getById(userId);
        
        // Check if user is a vendor
        boolean isVendor = false;
        UUID vendorId = null;
        var vendor = vendorRepository.findByUserId(userId);
        if (vendor.isPresent()) {
            isVendor = true;
            vendorId = vendor.get().getSupplierId();
        }
        
        // Check if user has any admin permissions (community helper)
        boolean isCommunityHelper = false;
        var admin = adminRepository.findById(userId);
        if (admin.isPresent() && !admin.get().getPermissions().isEmpty()) {
            isCommunityHelper = true;
        }
        
        return new com.giftastic.giftastic.modules.user.dto.PublicUserProfileResponse(
            user.getId(),
            user.getFullName() != null ? user.getFullName() : "User",
            isVendor,
            vendorId,
            isCommunityHelper,
            java.time.LocalDate.now() // TODO: Add createdAt field to User entity
        );
    }
} 
