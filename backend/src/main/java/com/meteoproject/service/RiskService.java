package com.meteoproject.service;

import com.meteoproject.domain.project.Project;
import com.meteoproject.domain.risk.Risk;
import com.meteoproject.domain.risk.enums.RiskCategory;
import com.meteoproject.domain.risk.enums.RiskStatus;
import com.meteoproject.domain.user.User;
import com.meteoproject.dto.risk.*;
import com.meteoproject.exception.BusinessRuleException;
import com.meteoproject.exception.ResourceNotFoundException;
import com.meteoproject.repository.ProjectRepository;
import com.meteoproject.repository.RiskRepository;
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
public class RiskService {

    private final RiskRepository riskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public RiskResponse createRisk(UUID projectId, CreateRiskRequest request) {
        log.info("Creating risk for project: {}", projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        RiskCategory category = parseCategory(request.getCategory());

        User owner = null;
        if (request.getOwnerId() != null) {
            owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getOwnerId()));
        }

        Risk risk = Risk.builder()
                .project(project)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(category)
                .probability(request.getProbability())
                .impact(request.getImpact())
                .mitigationPlan(request.getMitigationPlan())
                .owner(owner)
                .build();

        Risk saved = riskRepository.save(risk);
        log.info("Risk created with id: {}", saved.getId());
        return toResponse(saved);
    }

    public RiskResponse updateRisk(UUID riskId, UpdateRiskRequest request) {
        log.info("Updating risk: {}", riskId);

        Risk risk = riskRepository.findById(riskId)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", "id", riskId));

        if (risk.getStatus() == RiskStatus.CLOSED) {
            throw new BusinessRuleException("RISK_CLOSED", "Cannot update a closed risk");
        }

        if (request.getTitle() != null) {
            risk.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            risk.setDescription(request.getDescription());
        }
        if (request.getCategory() != null) {
            risk.setCategory(parseCategory(request.getCategory()));
        }
        if (request.getProbability() != null) {
            risk.setProbability(request.getProbability());
        }
        if (request.getImpact() != null) {
            risk.setImpact(request.getImpact());
        }
        if (request.getMitigationPlan() != null) {
            risk.setMitigationPlan(request.getMitigationPlan());
        }
        if (request.getOwnerId() != null) {
            User owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getOwnerId()));
            risk.setOwner(owner);
        }
        if (request.getStatus() != null) {
            RiskStatus newStatus = parseStatus(request.getStatus());
            risk.setStatus(newStatus);
            if (newStatus == RiskStatus.CLOSED) {
                risk.setClosedAt(LocalDate.now());
            }
            if (newStatus == RiskStatus.MATERIALIZED) {
                risk.setMaterializedAt(LocalDate.now());
            }
        }

        Risk saved = riskRepository.save(risk);
        log.info("Risk updated: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public RiskResponse getRisk(UUID riskId) {
        Risk risk = riskRepository.findById(riskId)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", "id", riskId));
        return toResponse(risk);
    }

    @Transactional(readOnly = true)
    public List<RiskResponse> getProjectRisks(UUID projectId, RiskStatus status) {
        List<Risk> risks;
        if (status != null) {
            risks = riskRepository.findByProjectIdAndStatus(projectId, status);
        } else {
            risks = riskRepository.findByProjectId(projectId);
        }
        return risks.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void deleteRisk(UUID riskId) {
        log.info("Deleting risk: {}", riskId);
        Risk risk = riskRepository.findById(riskId)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", "id", riskId));
        riskRepository.delete(risk);
        log.info("Risk deleted: {}", riskId);
    }

    @Transactional(readOnly = true)
    public RiskSummary getRiskSummary(UUID projectId) {
        log.info("Generating risk summary for project: {}", projectId);

        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }

        List<Risk> allRisks = riskRepository.findByProjectId(projectId);
        List<Risk> activeRisks = riskRepository.findActiveRisks(projectId);

        Double avgSeverity = riskRepository.averageSeverity(projectId);
        long withMitigation = riskRepository.countWithMitigation(projectId);

        Map<RiskCategory, Integer> byCategory = allRisks.stream()
                .collect(Collectors.groupingBy(Risk::getCategory, Collectors.summingInt(r -> 1)));

        Map<RiskStatus, Integer> byStatus = allRisks.stream()
                .collect(Collectors.groupingBy(Risk::getStatus, Collectors.summingInt(r -> 1)));

        double mitigationCoverage = activeRisks.isEmpty() ? 0.0
                : (double) withMitigation / activeRisks.size() * 100.0;

        return RiskSummary.builder()
                .projectId(projectId)
                .totalRisks(allRisks.size())
                .activeRisks(activeRisks.size())
                .averageSeverity(avgSeverity != null ? avgSeverity : 0.0)
                .risksByCategory(byCategory)
                .risksByStatus(byStatus)
                .mitigationCoverage(Math.round(mitigationCoverage * 100.0) / 100.0)
                .build();
    }

    // --- Private mapper methods ---

    private RiskResponse toResponse(Risk risk) {
        User owner = risk.getOwner();
        return RiskResponse.builder()
                .id(risk.getId())
                .projectId(risk.getProject().getId())
                .title(risk.getTitle())
                .description(risk.getDescription())
                .category(risk.getCategory().name())
                .probability(risk.getProbability())
                .impact(risk.getImpact())
                .severity(risk.getSeverity())
                .status(risk.getStatus().name())
                .mitigationPlan(risk.getMitigationPlan())
                .contingencyPlan(risk.getContingencyPlan())
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getFirstName() + " " + owner.getLastName() : null)
                .identifiedAt(risk.getIdentifiedAt())
                .reviewDate(risk.getReviewDate())
                .materializedAt(risk.getMaterializedAt())
                .closedAt(risk.getClosedAt())
                .createdAt(risk.getCreatedAt())
                .updatedAt(risk.getUpdatedAt())
                .build();
    }

    private RiskCategory parseCategory(String category) {
        try {
            return RiskCategory.valueOf(category.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("INVALID_CATEGORY", "category",
                    "Invalid risk category: " + category + ". Valid values: " + Arrays.toString(RiskCategory.values()));
        }
    }

    private RiskStatus parseStatus(String status) {
        try {
            return RiskStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("INVALID_STATUS", "status",
                    "Invalid risk status: " + status + ". Valid values: " + Arrays.toString(RiskStatus.values()));
        }
    }
}
