package com.meteoproject.service;

import com.meteoproject.domain.corrective.CorrectiveAction;
import com.meteoproject.domain.corrective.enums.CorrectiveStatus;
import com.meteoproject.domain.corrective.enums.Priority;
import com.meteoproject.domain.project.Project;
import com.meteoproject.domain.user.User;
import com.meteoproject.dto.corrective.*;
import com.meteoproject.exception.BusinessRuleException;
import com.meteoproject.exception.ResourceNotFoundException;
import com.meteoproject.repository.CorrectiveActionRepository;
import com.meteoproject.repository.ProjectRepository;
import com.meteoproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CorrectiveActionService {

    private final CorrectiveActionRepository correctiveActionRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public CorrectiveResponse createAction(UUID projectId, UUID createdById, CreateCorrectiveRequest request) {
        log.info("Creating corrective action for project: {}", projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        Priority priority = parsePriority(request.getPriority());

        User responsible = null;
        if (request.getAssignedToId() != null) {
            responsible = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
        }

        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDate.now())) {
            throw new BusinessRuleException("INVALID_DUE_DATE", "dueDate", "Due date cannot be in the past");
        }

        CorrectiveAction action = CorrectiveAction.builder()
                .project(project)
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(priority)
                .responsible(responsible)
                .deadline(request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(30))
                .build();

        CorrectiveAction saved = correctiveActionRepository.save(action);
        log.info("Corrective action created with id: {}", saved.getId());
        return toResponse(saved, createdById);
    }

    public CorrectiveResponse updateAction(UUID actionId, UpdateCorrectiveRequest request) {
        log.info("Updating corrective action: {}", actionId);

        CorrectiveAction action = correctiveActionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("CorrectiveAction", "id", actionId));

        if (action.getStatus() == CorrectiveStatus.COMPLETED || action.getStatus() == CorrectiveStatus.CANCELLED) {
            throw new BusinessRuleException("ACTION_CLOSED", "Cannot update a completed or cancelled action");
        }

        if (request.getTitle() != null) {
            action.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            action.setDescription(request.getDescription());
        }
        if (request.getPriority() != null) {
            action.setPriority(parsePriority(request.getPriority()));
        }
        if (request.getAssignedToId() != null) {
            User responsible = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
            action.setResponsible(responsible);
        }
        if (request.getDueDate() != null) {
            action.setDeadline(request.getDueDate());
        }
        if (request.getStatus() != null) {
            CorrectiveStatus newStatus = parseStatus(request.getStatus());
            action.setStatus(newStatus);
            if (newStatus == CorrectiveStatus.COMPLETED) {
                action.setCompletedAt(LocalDate.now());
            }
        }

        CorrectiveAction saved = correctiveActionRepository.save(action);
        log.info("Corrective action updated: {}", saved.getId());
        return toResponse(saved, null);
    }

    @Transactional(readOnly = true)
    public CorrectiveResponse getAction(UUID actionId) {
        CorrectiveAction action = correctiveActionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("CorrectiveAction", "id", actionId));
        return toResponse(action, null);
    }

    @Transactional(readOnly = true)
    public List<CorrectiveResponse> getProjectActions(UUID projectId, CorrectiveStatus status) {
        List<CorrectiveAction> actions;
        if (status != null) {
            actions = correctiveActionRepository.findByProjectIdAndStatus(projectId, status);
        } else {
            actions = correctiveActionRepository.findByProjectId(projectId);
        }
        return actions.stream().map(a -> toResponse(a, null)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CorrectiveResponse> getMyActions(UUID userId) {
        List<CorrectiveAction> actions = correctiveActionRepository.findByResponsibleId(userId);
        return actions.stream().map(a -> toResponse(a, null)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CorrectiveResponse> getOverdueActions(UUID projectId) {
        List<CorrectiveAction> actions = correctiveActionRepository.findOverdueByProjectId(projectId);
        return actions.stream().map(a -> toResponse(a, null)).collect(Collectors.toList());
    }

    // --- Private mapper methods ---

    private CorrectiveResponse toResponse(CorrectiveAction action, UUID createdById) {
        User responsible = action.getResponsible();
        return CorrectiveResponse.builder()
                .id(action.getId())
                .projectId(action.getProject().getId())
                .title(action.getTitle())
                .description(action.getDescription())
                .priority(action.getPriority().name())
                .status(action.getStatus().name())
                .assignedToId(responsible != null ? responsible.getId() : null)
                .assignedToName(responsible != null ? responsible.getFirstName() + " " + responsible.getLastName() : null)
                .createdById(createdById)
                .dueDate(action.getDeadline())
                .completedAt(action.getCompletedAt())
                .linkedIndicatorId(action.getIndicator() != null ? action.getIndicator().getId() : null)
                .linkedRiskId(action.getRisk() != null ? action.getRisk().getId() : null)
                .isOverdue(action.isOverdue())
                .createdAt(action.getCreatedAt())
                .updatedAt(action.getUpdatedAt())
                .build();
    }

    private Priority parsePriority(String priority) {
        try {
            return Priority.valueOf(priority.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("INVALID_PRIORITY", "priority",
                    "Invalid priority: " + priority + ". Valid values: " + Arrays.toString(Priority.values()));
        }
    }

    private CorrectiveStatus parseStatus(String status) {
        try {
            return CorrectiveStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("INVALID_STATUS", "status",
                    "Invalid corrective status: " + status + ". Valid values: " + Arrays.toString(CorrectiveStatus.values()));
        }
    }
}
