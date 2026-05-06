package com.meteoproject.service;

import com.meteoproject.domain.user.User;
import com.meteoproject.dto.user.UpdateUserRequest;
import com.meteoproject.dto.user.UserResponse;
import com.meteoproject.exception.BusinessRuleException;
import com.meteoproject.exception.ResourceNotFoundException;
import com.meteoproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserResponse getProfile(UUID userId) {
        User user = findUserOrThrow(userId);
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateUserRequest request) {
        User user = findUserOrThrow(userId);

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        User saved = userRepository.save(user);
        log.info("User profile updated: {}", userId);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> listUsers(Boolean active, String search, Pageable pageable) {
        Page<User> users;

        if (search != null && !search.isBlank()) {
            boolean isActive = active != null ? active : true;
            users = userRepository.searchUsers(isActive, search, pageable);
        } else if (active != null) {
            users = userRepository.findByActive(active, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID userId) {
        User user = findUserOrThrow(userId);
        return toResponse(user);
    }

    @Transactional
    public void deactivateUser(UUID userId) {
        User user = findUserOrThrow(userId);

        if (!user.getActive()) {
            throw new BusinessRuleException("USER_ALREADY_INACTIVE", "User is already deactivated");
        }

        user.setActive(false);
        userRepository.save(user);
        log.info("User deactivated: {}", userId);
    }

    @Transactional
    public void activateUser(UUID userId) {
        User user = findUserOrThrow(userId);

        if (user.getActive()) {
            throw new BusinessRuleException("USER_ALREADY_ACTIVE", "User is already active");
        }

        user.setActive(true);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);
        log.info("User activated: {}", userId);
    }

    private User findUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .role(user.getDefaultRole().name())
                .active(user.getActive())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
