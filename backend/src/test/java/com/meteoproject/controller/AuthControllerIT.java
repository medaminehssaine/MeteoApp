package com.meteoproject.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meteoproject.dto.auth.AuthResponse;
import com.meteoproject.dto.auth.LoginRequest;
import com.meteoproject.dto.auth.RegisterRequest;
import com.meteoproject.exception.BusinessRuleException;
import com.meteoproject.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean AuthService authService;

    @Test
    void loginReturns200WithValidCredentials() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse("admin@meteoproject.com"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login("admin@meteoproject.com", "Admin@2026!"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access"));
    }

    @Test
    void loginReturns400WithInvalidCredentials() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BusinessRuleException("AUTH_FAILED", "Invalid email or password"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login("admin@meteoproject.com", "wrong"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerReturns201() throws Exception {
        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse("new@meteoproject.com"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register("new@meteoproject.com"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.email").value("new@meteoproject.com"));
    }

    @Test
    void registerDuplicateReturns400() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new BusinessRuleException("EMAIL_EXISTS", "email", "Email is already registered"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register("new@meteoproject.com"))))
                .andExpect(status().isBadRequest());
    }

    private LoginRequest login(String email, String password) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    private RegisterRequest register(String email) {
        RegisterRequest request = new RegisterRequest();
        request.setEmail(email);
        request.setPassword("Admin@2026!");
        request.setFirstName("New");
        request.setLastName("User");
        return request;
    }

    private AuthResponse authResponse(String email) {
        return AuthResponse.builder()
                .accessToken("access")
                .refreshToken("refresh")
                .expiresIn(3600)
                .tokenType("Bearer")
                .user(AuthResponse.UserInfo.builder()
                        .id(UUID.randomUUID())
                        .email(email)
                        .firstName("Test")
                        .lastName("User")
                        .role("ADMIN")
                        .build())
                .build();
    }
}
