package com.giftastic.giftastic.modules.identity.service;

import com.giftastic.giftastic.modules.admin.repository.AdminRepository;
import com.giftastic.giftastic.modules.identity.domain.RegistrationPolicy;
import com.giftastic.giftastic.modules.user.domain.User;
import com.giftastic.giftastic.modules.user.repository.UserRepository;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;
import com.giftastic.giftastic.common.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IdentityServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final VendorRepository vendorRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        Set<SimpleGrantedAuthority> authorities = adminRepository.findByUserId(user.getId())
                .map(admin -> admin.getPermissions().stream()
                        .map(perm -> new SimpleGrantedAuthority(perm.name()))
                        .collect(Collectors.toSet()))
                .orElse(Set.of());

        java.util.UUID supplierId = vendorRepository.findByUserId(user.getId())
                .map(Vendor::getSupplierId)
                .orElse(null);

        Set<SimpleGrantedAuthority> mutableAuthorities = new java.util.HashSet<>(authorities);
        mutableAuthorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        if (supplierId != null) {
            mutableAuthorities.add(new SimpleGrantedAuthority("ROLE_VENDOR"));
        }

        return UserPrincipal.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(mutableAuthorities)
                .supplierId(supplierId)
                .build();
    }

    @Transactional
    public void register(String name, String email, String rawPassword) {
        RegistrationPolicy.validate(email, rawPassword);
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        User user = User.create(email, passwordEncoder.encode(rawPassword));
        user.setFullName(name);
        userRepository.save(user);
    }
}
