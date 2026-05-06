package com.meteoproject.service;

import com.meteoproject.domain.plan.Module;
import com.meteoproject.domain.project.Project;
import com.meteoproject.domain.project.enums.ProjectStatus;
import com.meteoproject.domain.project.enums.Visibility;
import com.meteoproject.domain.user.User;
import com.meteoproject.domain.user.UserProjectRole;
import com.meteoproject.domain.user.enums.Role;
import com.meteoproject.dto.project.*;
import com.meteoproject.exception.BusinessRuleException;
import com.meteoproject.exception.ResourceNotFoundException;
import com.meteoproject.repository.MeteoHistoryRepository;
import com.meteoproject.repository.ModuleRepository;
import com.meteoproject.repository.ProjectRepository;
import com.meteoproject.repository.UserProjectRoleRepository;
import com.meteoproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ModuleRepository moduleRepository;
    private final UserProjectRoleRepository userProjectRoleRepository;
    private final UserRepository userRepository;
    private final MeteoHistoryRepository meteoHistoryRepository;

    @Transactional
    public ProjectResponse createProject(UUID ownerId, CreateProjectRequest request) {
        log.info("Creating project '{}' for user {}", request.getName(), ownerId);

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", ownerId));

        if (projectRepository.existsByName(request.getName())) {
            throw new BusinessRuleException("UNIQUE_NAME", "name", "A project with this name already exists");
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessRuleException("DATE_ORDER", "endDate", "End date must be after start date");
        }

        Project project = Project.builder()
                .name(request.getName())
                .code(request.getCode() != null ? request.getCode() : generateCode(request.getName()))
                .shortDescription(request.getShortDescription())
                .longDescription(request.getLongDescription())
                .type(request.getType())
                .criticality(request.getCriticality())
                .visibility(request.getVisibility() != null ? request.getVisibility() : Visibility.RESTRICTED)
                .status(ProjectStatus.PREPARATION)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .budgetTotal(request.getBudgetTotal() != null ? request.getBudgetTotal() : BigDecimal.ZERO)
                .chef(owner)
                .build();

        project = projectRepository.save(project);

        UserProjectRole chefRole = UserProjectRole.builder()
                .user(owner)
                .project(project)
                .role(Role.CHEF)
                .assignedAt(LocalDate.now())
                .build();
        userProjectRoleRepository.save(chefRole);

        log.info("Project '{}' created with id {}", project.getName(), project.getId());
        return toProjectResponse(project, 1);
    }

    @Transactional
    public ProjectResponse updateProject(UUID projectId, UpdateProjectRequest request) {
        log.info("Updating project {}", projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        if (request.getName() != null) {
            if (!project.getName().equals(request.getName()) && projectRepository.existsByName(request.getName())) {
                throw new BusinessRuleException("UNIQUE_NAME", "name", "A project with this name already exists");
            }
            project.setName(request.getName());
        }
        if (request.getShortDescription() != null) {
            project.setShortDescription(request.getShortDescription());
        }
        if (request.getLongDescription() != null) {
            project.setLongDescription(request.getLongDescription());
        }
        if (request.getType() != null) {
            project.setType(request.getType());
        }
        if (request.getCriticality() != null) {
            project.setCriticality(request.getCriticality());
        }
        if (request.getVisibility() != null) {
            project.setVisibility(request.getVisibility());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getStartDate() != null) {
            project.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            project.setEndDate(request.getEndDate());
        }
        if (request.getBudgetTotal() != null) {
            project.setBudgetTotal(request.getBudgetTotal());
        }

        if (project.getEndDate().isBefore(project.getStartDate())) {
            throw new BusinessRuleException("DATE_ORDER", "endDate", "End date must be after start date");
        }

        project = projectRepository.save(project);
        long memberCount = userProjectRoleRepository.countByProjectIdAndRemovedAtIsNull(projectId);
        return toProjectResponse(project, memberCount);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(UUID projectId) {
        log.debug("Fetching project {}", projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        long memberCount = userProjectRoleRepository.countByProjectIdAndRemovedAtIsNull(projectId);
        return toProjectResponse(project, memberCount);
    }

    @Transactional(readOnly = true)
    public Page<ProjectSummaryResponse> listUserProjects(UUID userId, Pageable pageable) {
        log.debug("Listing projects for user {}", userId);

        List<UUID> projectIds = userProjectRoleRepository.findProjectIdsByUserId(userId);
        if (projectIds.isEmpty()) {
            return Page.empty(pageable);
        }

        return projectRepository.findByIdInAndActive(projectIds, pageable)
                .map(this::toProjectSummaryResponse);
    }

    @Transactional
    public void deleteProject(UUID projectId) {
        log.info("Soft-deleting project {}", projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        project.setStatus(ProjectStatus.ARCHIVED);
        projectRepository.save(project);
    }

    @Transactional
    public ModuleResponse addModule(UUID projectId, ModuleRequest request) {
        log.info("Adding module '{}' to project {}", request.getName(), projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        if (moduleRepository.existsByProjectIdAndName(projectId, request.getName())) {
            throw new BusinessRuleException("UNIQUE_MODULE_NAME", "name",
                    "A module with this name already exists in the project");
        }

        BigDecimal newWeight = request.getWeight() != null ? request.getWeight() : BigDecimal.ZERO;
        BigDecimal currentTotalWeight = moduleRepository.sumWeightByProjectId(projectId);
        if (currentTotalWeight.add(newWeight).compareTo(BigDecimal.ONE) > 0) {
            throw new BusinessRuleException("WEIGHT_LIMIT", "weight",
                    "Total module weight cannot exceed 1.0. Current total: " + currentTotalWeight);
        }

        int nextOrder = project.getModules().size();

        Module module = Module.builder()
                .project(project)
                .name(request.getName())
                .description(request.getDescription())
                .weight(newWeight)
                .orderIndex(nextOrder)
                .build();

        module = moduleRepository.save(module);
        return toModuleResponse(module);
    }

    @Transactional(readOnly = true)
    public List<ModuleResponse> getModules(UUID projectId) {
        log.debug("Fetching modules for project {}", projectId);

        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }

        return moduleRepository.findByProjectIdOrderByOrderIndexAsc(projectId).stream()
                .map(this::toModuleResponse)
                .toList();
    }

    @Transactional
    public void deleteModule(UUID moduleId) {
        log.info("Deleting module {}", moduleId);

        if (!moduleRepository.existsById(moduleId)) {
            throw new ResourceNotFoundException("Module", "id", moduleId);
        }
        moduleRepository.deleteById(moduleId);
    }

    @Transactional
    public TeamMemberResponse addTeamMember(UUID projectId, UUID userId, Role role, UUID assignedById) {
        log.info("Adding user {} to project {} with role {}", userId, projectId, role);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<UserProjectRole> existingRoles = userProjectRoleRepository.findActiveRoles(userId, projectId);
        if (!existingRoles.isEmpty()) {
            throw new BusinessRuleException("DUPLICATE_MEMBER", "userId",
                    "User already has an active role in this project");
        }

        UserProjectRole upr = UserProjectRole.builder()
                .user(user)
                .project(project)
                .role(role)
                .assignedAt(LocalDate.now())
                .build();

        upr = userProjectRoleRepository.save(upr);
        return toTeamMemberResponse(upr);
    }

    @Transactional
    public void removeTeamMember(UUID projectId, UUID userId) {
        log.info("Removing user {} from project {}", userId, projectId);

        List<UserProjectRole> roles = userProjectRoleRepository.findActiveRoles(userId, projectId);
        if (roles.isEmpty()) {
            throw new ResourceNotFoundException("TeamMember", "userId", userId);
        }

        for (UserProjectRole role : roles) {
            role.setRemovedAt(LocalDate.now());
            userProjectRoleRepository.save(role);
        }
    }

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getTeamMembers(UUID projectId) {
        log.debug("Fetching team members for project {}", projectId);

        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }

        return userProjectRoleRepository.findByProjectIdActive(projectId).stream()
                .map(this::toTeamMemberResponse)
                .toList();
    }

    // --- Private mapper methods ---

    private ProjectResponse toProjectResponse(Project project, long memberCount) {
        var latestMeteo = meteoHistoryRepository.findTopByProjectIdOrderByCalculationDateDesc(project.getId());
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .code(project.getCode())
                .shortDescription(project.getShortDescription())
                .longDescription(project.getLongDescription())
                .type(project.getType())
                .status(project.getStatus())
                .criticality(project.getCriticality())
                .visibility(project.getVisibility())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .budgetTotal(project.getBudgetTotal())
                .budgetConsumed(project.getBudgetConsumed())
                .chefName(project.getChef() != null ? project.getChef().getFullName() : null)
                .sponsorName(project.getSponsor() != null ? project.getSponsor().getFullName() : null)
                .directorName(project.getDirector() != null ? project.getDirector().getFullName() : null)
                .daysRemaining(project.getDaysRemaining())
                .memberCount(memberCount)
                .currentMeteoState(latestMeteo.map(m -> m.getMeteoState()).orElse(null))
                .currentMeteoScore(latestMeteo.map(m -> m.getCalculatedScore() != null ? m.getCalculatedScore().intValue() : null).orElse(null))
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private ProjectSummaryResponse toProjectSummaryResponse(Project project) {
        var latestMeteo = meteoHistoryRepository.findTopByProjectIdOrderByCalculationDateDesc(project.getId());
        long memberCount = userProjectRoleRepository.countByProjectIdAndRemovedAtIsNull(project.getId());
        return ProjectSummaryResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .code(project.getCode())
                .shortDescription(project.getShortDescription())
                .type(project.getType())
                .status(project.getStatus())
                .criticality(project.getCriticality())
                .visibility(project.getVisibility())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .budgetTotal(project.getBudgetTotal())
                .budgetConsumed(project.getBudgetConsumed())
                .chefName(project.getChef() != null ? project.getChef().getFullName() : null)
                .sponsorName(project.getSponsor() != null ? project.getSponsor().getFullName() : null)
                .directorName(project.getDirector() != null ? project.getDirector().getFullName() : null)
                .daysRemaining(project.getDaysRemaining())
                .memberCount(memberCount)
                .currentMeteoState(latestMeteo.map(m -> m.getMeteoState()).orElse(null))
                .currentMeteoScore(latestMeteo.map(m -> m.getCalculatedScore() != null ? m.getCalculatedScore().intValue() : null).orElse(null))
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private ModuleResponse toModuleResponse(Module module) {
        return ModuleResponse.builder()
                .id(module.getId())
                .name(module.getName())
                .description(module.getDescription())
                .weight(module.getWeight())
                .orderIndex(module.getOrderIndex())
                .build();
    }

    private TeamMemberResponse toTeamMemberResponse(UserProjectRole upr) {
        User user = upr.getUser();
        return TeamMemberResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(upr.getRole())
                .assignedAt(upr.getAssignedAt())
                .build();
    }

    private String generateCode(String name) {
        String base = name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (base.length() > 10) {
            base = base.substring(0, 10);
        }
        String code = "PRJ-" + base;
        int suffix = 1;
        String candidate = code;
        while (projectRepository.existsByCode(candidate)) {
            candidate = code + "-" + suffix++;
        }
        return candidate;
    }
}
