package com.meteoproject.service;

import com.meteoproject.config.JwtProperties;
import com.meteoproject.config.SecurityProperties;
import com.meteoproject.domain.user.RefreshToken;
import com.meteoproject.domain.user.User;
import com.meteoproject.domain.user.enums.Role;
import com.meteoproject.dto.auth.AuthResponse;
import com.meteoproject.dto.auth.LoginRequest;
import com.meteoproject.dto.auth.RegisterRequest;
import com.meteoproject.exception.BusinessRuleException;
import com.meteoproject.repository.RefreshTokenRepository;
import com.meteoproject.repository.UserRepository;
import com.meteoproject.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock JwtTokenProvider tokenProvider;
    @Mock PasswordEncoder passwordEncoder;

    AuthService service;
    JwtProperties jwtProperties;
    SecurityProperties securityProperties;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties();
        jwtProperties.setAccessTokenExpiration(3_600_000);
        jwtProperties.setRefreshTokenExpiration(604_800_000);
        securityProperties = new SecurityProperties();
        service = new AuthService(
                userRepository,
                refreshTokenRepository,
                tokenProvider,
                jwtProperties,
                securityProperties,
                passwordEncoder);
    }

    @Test
    void loginSuccessReturnsAuthResponseWithTokens() {
        User user = user();
        LoginRequest request = login("admin@meteoproject.com", "Admin@2026!");
        when(userRepository.findByEmail("admin@meteoproject.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPasswordHash())).thenReturn(true);
        when(userRepository.save(user)).thenReturn(user);
        when(tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getDefaultRole().name())).thenReturn("access");
        when(tokenProvider.generateRefreshToken()).thenReturn("refresh");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = service.login(request);

        assertThat(response.getAccessToken()).isEqualTo("access");
        assertThat(response.getRefreshToken()).isEqualTo("refresh");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getUser().getEmail()).isEqualTo("admin@meteoproject.com");
    }

    @Test
    void loginWrongPasswordThrowsBusinessRuleException() {
        User user = user();
        LoginRequest request = login("admin@meteoproject.com", "bad");
        when(userRepository.findByEmail("admin@meteoproject.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPasswordHash())).thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);

        assertThatThrownBy(() -> service.login(request)).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void loginLockedAccountThrowsBusinessRuleException() {
        User user = user();
        user.setLockedUntil(Instant.now().plusSeconds(60));
        when(userRepository.findByEmail("admin@meteoproject.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.login(login("admin@meteoproject.com", "Admin@2026!")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("locked");
    }

    @Test
    void registerDuplicateEmailThrowsBusinessRuleException() {
        RegisterRequest request = register();
        when(userRepository.existsByEmail("new@meteoproject.com")).thenReturn(true);

        assertThatThrownBy(() -> service.register(request)).isInstanceOf(BusinessRuleException.class);
    }

    private LoginRequest login(String email, String password) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    private RegisterRequest register() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@meteoproject.com");
        request.setPassword("Admin@2026!");
        request.setFirstName("New");
        request.setLastName("User");
        return request;
    }

    private User user() {
        return User.builder()
                .id(UUID.randomUUID())
                .email("admin@meteoproject.com")
                .passwordHash("hash")
                .firstName("Admin")
                .lastName("System")
                .defaultRole(Role.ADMIN)
                .active(true)
                .failedLoginAttempts(0)
                .build();
    }
}
