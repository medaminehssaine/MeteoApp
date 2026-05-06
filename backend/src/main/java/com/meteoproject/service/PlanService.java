package com.meteoproject.service;

import com.meteoproject.domain.plan.Action;
import com.meteoproject.domain.plan.ActionDependency;
import com.meteoproject.domain.plan.Module;
import com.meteoproject.domain.plan.enums.ActionStatus;
import com.meteoproject.domain.plan.enums.BlockingType;
import com.meteoproject.domain.plan.enums.DependencyType;
import com.meteoproject.domain.user.User;
import com.meteoproject.dto.plan.*;
import com.meteoproject.exception.BusinessRuleException;
import com.meteoproject.exception.ResourceNotFoundException;
import com.meteoproject.repository.ActionDependencyRepository;
import com.meteoproject.repository.ActionRepository;
import com.meteoproject.repository.ModuleRepository;
import com.meteoproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PlanService {

    private final ActionRepository actionRepository;
    private final ActionDependencyRepository actionDependencyRepository;
    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;

    // ---- Action CRUD ----

    public ActionResponse createAction(CreateActionRequest request) {
        log.info("Creating action '{}' for module {}", request.getName(), request.getModuleId());

        Module module = moduleRepository.findById(request.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module", "id", request.getModuleId()));

        User responsible = null;
        if (request.getResponsibleId() != null) {
            responsible = userRepository.findById(request.getResponsibleId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getResponsibleId()));
        }

        if (request.getPlannedEndDate().isBefore(request.getStartDate())) {
            throw new BusinessRuleException("INVALID_DATES", "Planned end date must be after start date");
        }

        int durationDays = (int) ChronoUnit.DAYS.between(request.getStartDate(), request.getPlannedEndDate());

        Action action = Action.builder()
                .project(module.getProject())
                .module(module)
                .title(request.getName())
                .description(request.getDescription())
                .responsible(responsible)
                .plannedStart(request.getStartDate())
                .plannedEnd(request.getPlannedEndDate())
                .durationDays(durationDays)
                .status(ActionStatus.NOT_STARTED)
                .progress(0)
                .build();

        if (request.getWeight() != null) {
            // Store weight as durationDays override if provided — weight is conceptual
            // The entity does not have a separate weight field; we use durationDays for weighted progress
            action.setDurationDays(request.getWeight() > 0 ? Math.max(durationDays, 1) : durationDays);
        }

        action = actionRepository.save(action);
        log.info("Created action {} with id {}", action.getTitle(), action.getId());

        return toActionResponse(action);
    }

    public ActionResponse updateAction(UUID actionId, UpdateActionRequest request) {
        log.info("Updating action {}", actionId);

        Action action = actionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Action", "id", actionId));

        if (request.getName() != null) {
            action.setTitle(request.getName());
        }
        if (request.getDescription() != null) {
            action.setDescription(request.getDescription());
        }
        if (request.getResponsibleId() != null) {
            User responsible = userRepository.findById(request.getResponsibleId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getResponsibleId()));
            action.setResponsible(responsible);
        }
        if (request.getStatus() != null) {
            ActionStatus newStatus = ActionStatus.valueOf(request.getStatus());
            if (newStatus == ActionStatus.BLOCKED && action.getBlockedSince() == null) {
                action.setBlockedSince(LocalDate.now());
            } else if (newStatus != ActionStatus.BLOCKED) {
                action.setBlockedSince(null);
            }
            action.setStatus(newStatus);
        }
        if (request.getBlockingType() != null) {
            action.setBlockingType(BlockingType.valueOf(request.getBlockingType()));
        }
        if (request.getStartDate() != null) {
            action.setPlannedStart(request.getStartDate());
            recalculateDuration(action);
        }
        if (request.getPlannedEndDate() != null) {
            action.setPlannedEnd(request.getPlannedEndDate());
            recalculateDuration(action);
        }
        if (request.getActualEndDate() != null) {
            action.setActualEnd(request.getActualEndDate());
        }
        if (request.getProgressPercent() != null) {
            action.setProgress(request.getProgressPercent());
            if (request.getProgressPercent() == 100 && action.getStatus() != ActionStatus.COMPLETED) {
                action.setStatus(ActionStatus.COMPLETED);
                action.setActualEnd(LocalDate.now());
            }
        }

        action = actionRepository.save(action);
        log.info("Updated action {}", actionId);

        return toActionResponse(action);
    }

    @Transactional(readOnly = true)
    public ActionResponse getAction(UUID actionId) {
        Action action = actionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Action", "id", actionId));
        return toActionResponse(action);
    }

    @Transactional(readOnly = true)
    public List<ActionResponse> getActionsByModule(UUID moduleId) {
        moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module", "id", moduleId));
        return actionRepository.findByModuleIdOrderByOrderIndexAsc(moduleId)
                .stream()
                .map(this::toActionResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActionResponse> getActionsByProject(UUID projectId) {
        return actionRepository.findByProjectIdOrderByOrderIndexAsc(projectId)
                .stream()
                .map(this::toActionResponse)
                .collect(Collectors.toList());
    }

    public void deleteAction(UUID actionId) {
        Action action = actionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Action", "id", actionId));

        // Remove dependencies referencing this action
        List<ActionDependency> incomingDeps = actionDependencyRepository.findByTargetActionId(actionId);
        actionDependencyRepository.deleteAll(incomingDeps);

        actionRepository.delete(action);
        log.info("Deleted action {}", actionId);
    }

    // ---- Dependencies ----

    public DependencyResponse addDependency(UUID actionId, DependencyRequest request) {
        log.info("Adding dependency: action {} depends on {}", actionId, request.getDependsOnActionId());

        Action sourceAction = actionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Action", "id", actionId));
        Action targetAction = actionRepository.findById(request.getDependsOnActionId())
                .orElseThrow(() -> new ResourceNotFoundException("Action", "id", request.getDependsOnActionId()));

        if (actionId.equals(request.getDependsOnActionId())) {
            throw new BusinessRuleException("SELF_DEPENDENCY", "An action cannot depend on itself");
        }

        if (actionDependencyRepository.existsBySourceActionIdAndTargetActionId(actionId, request.getDependsOnActionId())) {
            throw new BusinessRuleException("DUPLICATE_DEPENDENCY", "This dependency already exists");
        }

        // Check for circular dependencies
        if (hasCircularDependency(request.getDependsOnActionId(), actionId, new HashSet<>())) {
            throw new BusinessRuleException("CIRCULAR_DEPENDENCY", "Adding this dependency would create a circular dependency");
        }

        DependencyType dependencyType = DependencyType.valueOf(request.getDependencyType());

        ActionDependency dependency = ActionDependency.builder()
                .sourceAction(sourceAction)
                .targetAction(targetAction)
                .dependencyType(dependencyType)
                .build();

        dependency = actionDependencyRepository.save(dependency);
        log.info("Created dependency {} between actions {} -> {}", dependency.getId(), actionId, request.getDependsOnActionId());

        return toDependencyResponse(dependency);
    }

    public void removeDependency(UUID dependencyId) {
        ActionDependency dependency = actionDependencyRepository.findById(dependencyId)
                .orElseThrow(() -> new ResourceNotFoundException("ActionDependency", "id", dependencyId));
        actionDependencyRepository.delete(dependency);
        log.info("Removed dependency {}", dependencyId);
    }

    // ---- Progress Calculation ----

    @Transactional(readOnly = true)
    public ProgressSummary calculateProjectProgress(UUID projectId) {
        log.info("Calculating progress for project {}", projectId);

        List<Module> modules = moduleRepository.findByProjectIdOrderByOrderIndexAsc(projectId);

        List<ProgressSummary.ModuleProgress> moduleProgresses = new ArrayList<>();
        double totalWeightedProgress = 0.0;
        double totalWeight = 0.0;

        for (Module module : modules) {
            List<Action> actions = actionRepository.findByModuleIdOrderByOrderIndexAsc(module.getId());

            double moduleProgress = 0.0;
            if (!actions.isEmpty()) {
                double weightedProgressSum = 0.0;
                double weightSum = 0.0;

                for (Action action : actions) {
                    double actionWeight = action.getDurationDays() != null ? action.getDurationDays().doubleValue() : 1.0;
                    weightedProgressSum += actionWeight * action.getProgress();
                    weightSum += actionWeight;
                }

                if (weightSum > 0) {
                    moduleProgress = weightedProgressSum / weightSum;
                }
            }

            double moduleWeight = module.getWeight() != null ? module.getWeight().doubleValue() : 0.0;

            moduleProgresses.add(ProgressSummary.ModuleProgress.builder()
                    .moduleId(module.getId())
                    .moduleName(module.getName())
                    .weight(moduleWeight)
                    .progress(Math.round(moduleProgress * 100.0) / 100.0)
                    .build());

            totalWeightedProgress += moduleWeight * moduleProgress;
            totalWeight += moduleWeight;
        }

        double overallProgress = totalWeight > 0 ? totalWeightedProgress / totalWeight : 0.0;
        overallProgress = Math.round(overallProgress * 100.0) / 100.0;

        long totalActions = actionRepository.countByProjectId(projectId);
        long completedActions = actionRepository.countCompletedActions(projectId);
        long lateActions = actionRepository.countLateActions(projectId);
        long blockedActions = actionRepository.countBlockedActions(projectId);

        return ProgressSummary.builder()
                .projectId(projectId)
                .overallProgress(overallProgress)
                .moduleProgresses(moduleProgresses)
                .totalActions(totalActions)
                .completedActions(completedActions)
                .lateActions(lateActions)
                .blockedActions(blockedActions)
                .build();
    }

    // ---- Private helpers ----

    private boolean hasCircularDependency(UUID currentActionId, UUID targetActionId, Set<UUID> visited) {
        if (currentActionId.equals(targetActionId)) {
            return true;
        }
        if (visited.contains(currentActionId)) {
            return false;
        }
        visited.add(currentActionId);

        List<ActionDependency> dependencies = actionDependencyRepository.findBySourceActionId(currentActionId);
        for (ActionDependency dep : dependencies) {
            if (hasCircularDependency(dep.getTargetAction().getId(), targetActionId, visited)) {
                return true;
            }
        }
        return false;
    }

    private void recalculateDuration(Action action) {
        if (action.getPlannedStart() != null && action.getPlannedEnd() != null) {
            int days = (int) ChronoUnit.DAYS.between(action.getPlannedStart(), action.getPlannedEnd());
            action.setDurationDays(Math.max(days, 0));
        }
    }

    private ActionResponse toActionResponse(Action action) {
        List<ActionDependency> dependencies = actionDependencyRepository.findBySourceActionId(action.getId());

        List<DependencyResponse> dependencyResponses = dependencies.stream()
                .map(this::toDependencyResponse)
                .collect(Collectors.toList());

        String responsibleName = null;
        UUID responsibleId = null;
        if (action.getResponsible() != null) {
            responsibleId = action.getResponsible().getId();
            responsibleName = action.getResponsible().getFirstName() + " " + action.getResponsible().getLastName();
        }

        return ActionResponse.builder()
                .id(action.getId())
                .projectId(action.getProject().getId())
                .moduleId(action.getModule().getId())
                .moduleName(action.getModule().getName())
                .name(action.getTitle())
                .description(action.getDescription())
                .responsibleId(responsibleId)
                .responsibleName(responsibleName)
                .status(action.getStatus().name())
                .blockingType(action.getBlockingType() != null ? action.getBlockingType().name() : null)
                .blockingReason(action.getBlockingReason())
                .startDate(action.getPlannedStart())
                .plannedEndDate(action.getPlannedEnd())
                .actualEndDate(action.getActualEnd())
                .durationDays(action.getDurationDays())
                .progressPercent(action.getProgress())
                .isLate(action.isLate())
                .remainingDays(action.getRemainingDays())
                .blockedDays(action.getBlockedDays())
                .isMilestone(action.getIsMilestone())
                .orderIndex(action.getOrderIndex())
                .dependencies(dependencyResponses)
                .createdAt(action.getCreatedAt())
                .updatedAt(action.getUpdatedAt())
                .build();
    }

    private DependencyResponse toDependencyResponse(ActionDependency dependency) {
        return DependencyResponse.builder()
                .id(dependency.getId())
                .dependsOnActionId(dependency.getTargetAction().getId())
                .dependsOnActionName(dependency.getTargetAction().getTitle())
                .dependencyType(dependency.getDependencyType().name())
                .build();
    }
}
