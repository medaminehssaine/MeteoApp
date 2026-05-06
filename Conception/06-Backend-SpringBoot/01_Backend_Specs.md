# BACKEND SPRING BOOT - SPÉCIFICATIONS DÉTAILLÉES

## 1. Configuration Maven (pom.xml)

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.5</version>
</parent>

<properties>
    <java.version>17</java.version>
    <jjwt.version>0.12.5</jjwt.version>
</properties>

<dependencies>
    <!-- Core -->
    <dependency>spring-boot-starter-web</dependency>
    <dependency>spring-boot-starter-data-jpa</dependency>
    <dependency>spring-boot-starter-security</dependency>
    <dependency>spring-boot-starter-validation</dependency>
    <dependency>spring-boot-starter-cache</dependency>
    <dependency>spring-boot-starter-data-redis</dependency>
    <dependency>spring-boot-starter-actuator</dependency>

    <!-- Database -->
    <dependency>postgresql</dependency>
    <dependency>flyway-core</dependency>

    <!-- JWT -->
    <dependency>jjwt-api (0.12.5)</dependency>
    <dependency>jjwt-impl</dependency>
    <dependency>jjwt-jackson</dependency>

    <!-- Documentation -->
    <dependency>springdoc-openapi-starter-webmvc-ui (2.5.0)</dependency>

    <!-- Utilities -->
    <dependency>lombok</dependency>
    <dependency>mapstruct (1.5.5)</dependency>

    <!-- Export -->
    <dependency>itextpdf (itext7-core 8.0)</dependency>
    <dependency>apache-poi (5.2.5)</dependency>

    <!-- Test -->
    <dependency>spring-boot-starter-test</dependency>
    <dependency>spring-security-test</dependency>
    <dependency>testcontainers (postgresql)</dependency>
    <dependency>h2database (test)</dependency>
</dependencies>
```

## 2. Configuration (application.yml)

```yaml
spring:
  application:
    name: meteo-project

  datasource:
    url: jdbc:postgresql://localhost:5432/meteo_project
    username: ${DB_USERNAME:meteo}
    password: ${DB_PASSWORD:meteo}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000

  jpa:
    hibernate:
      ddl-auto: validate  # Flyway handles schema
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        default_schema: public
    open-in-view: false

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      timeout: 2000ms

  jackson:
    serialization:
      write-dates-as-timestamps: false
    default-property-inclusion: non_null

# JWT Configuration
app:
  jwt:
    secret: ${JWT_SECRET}
    access-token-expiration: 3600000    # 1 hour
    refresh-token-expiration: 604800000  # 7 days
    issuer: meteo-project

  # Security
  security:
    max-failed-attempts: 5
    lock-duration-minutes: 30
    bcrypt-strength: 12
    rate-limit:
      requests-per-minute: 100

  # CORS
  cors:
    allowed-origins: ${CORS_ORIGINS:http://localhost:4200}
    allowed-methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
    allowed-headers: "*"
    max-age: 3600

# Météo Engine
meteo:
  calculation:
    async: true
    thresholds:
      soleil: 85
      nuage-clair: 70
      nuage-charge: 50
    forcing-rules:
      blocked-action-days: 5
      late-actions-percentage: 30
      budget-overrun-percentage: 120
      no-update-days: 10
    criticality-coefficients:
      LOW: 0.5
      MEDIUM: 1.0
      HIGH: 1.5
      CRITICAL: 2.0

  # CQD
  cqd:
    cost:
      aligned-max: 5
      tension-max: 15
    quality:
      aligned-min: 70
      tension-min: 50
    delay:
      aligned-min: -5
      tension-min: -15
    trend-window: 3

  # AI Module
  ai:
    projection:
      weights:
        trend: 0.30
        simulation: 0.25
        action-plan: 0.20
        risk: 0.15
        capacity: 0.10
      trend:
        max-history-points: 10
        min-history-points: 3
      simulation:
        monte-carlo-iterations: 100
        duration-variance: 0.15
        velocity-window-days: 14
      confidence:
        high-threshold: 70
        medium-threshold: 45
      meteo-horizons: [7, 14, 21]
      cqd-horizons: [14, 30, 60]
      recommendations:
        max-count: 5
      accuracy:
        cron: "0 0 2 * * *"

  # Cache
  cache:
    meteo-ttl: 300       # 5 min
    cqd-ttl: 300         # 5 min
    projection-ttl: 900  # 15 min
    dashboard-ttl: 120   # 2 min

# Actuator
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when_authorized

# Logging
logging:
  level:
    com.meteoproject: DEBUG
    org.springframework.security: WARN
    org.hibernate.SQL: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

## 3. Entités JPA (Exemples Clés)

### 3.1 User Entity

```java
@Entity
@Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    @JsonIgnore
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_role", nullable = false)
    private Role defaultRole = Role.MEMBER;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<UserProjectRole> projectRoles = new ArrayList<>();

    public boolean isLocked() {
        return lockedUntil != null && Instant.now().isBefore(lockedUntil);
    }
}
```

### 3.2 Project Entity

```java
@Entity
@Table(name = "projects")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(unique = true, nullable = false, length = 20)
    private String code;

    @Column(name = "short_description")
    private String shortDescription;

    @Column(name = "long_description", columnDefinition = "TEXT")
    private String longDescription;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "budget_total", precision = 15, scale = 2)
    private BigDecimal budgetTotal = BigDecimal.ZERO;

    @Column(name = "budget_consumed", precision = 15, scale = 2)
    private BigDecimal budgetConsumed = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectType type = ProjectType.APPLICATION;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Criticality criticality = Criticality.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Visibility visibility = Visibility.RESTRICTED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus status = ProjectStatus.PREPARATION;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sponsor_id")
    private User sponsor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "director_id")
    private User director;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chef_id")
    private User chef;

    @Column(name = "last_update_at")
    private Instant lastUpdateAt;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    @OrderBy("orderIndex ASC")
    private List<Module> modules = new ArrayList<>();

    @OneToMany(mappedBy = "project")
    private List<ProjectIndicator> indicators = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
```

### 3.3 Action Entity

```java
@Entity
@Table(name = "actions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Action {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "planned_start", nullable = false)
    private LocalDate plannedStart;

    @Column(name = "actual_start")
    private LocalDate actualStart;

    @Column(name = "planned_end", nullable = false)
    private LocalDate plannedEnd;

    @Column(name = "actual_end")
    private LocalDate actualEnd;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionStatus status = ActionStatus.NOT_STARTED;

    @Column(nullable = false)
    @Min(0) @Max(100)
    private Integer progress = 0;

    @Column(name = "blocking_reason", columnDefinition = "TEXT")
    private String blockingReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "blocking_type")
    private BlockingType blockingType;

    @Column(name = "blocked_since")
    private LocalDate blockedSince;

    @Column(name = "is_milestone", nullable = false)
    private Boolean isMilestone = false;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex = 0;

    @OneToMany(mappedBy = "sourceAction", cascade = CascadeType.ALL)
    private List<ActionDependency> dependencies = new ArrayList<>();

    public boolean isLate() {
        return status != ActionStatus.COMPLETED
            && plannedEnd != null
            && LocalDate.now().isAfter(plannedEnd);
    }

    public int getRemainingDays() {
        int totalRemaining = (int)(durationDays * (100 - progress) / 100.0);
        return Math.max(totalRemaining, 0);
    }

    public long getBlockedDays() {
        if (status != ActionStatus.BLOCKED || blockedSince == null) return 0;
        return ChronoUnit.DAYS.between(blockedSince, LocalDate.now());
    }
}
```

## 4. Service Layer (Exemples Clés)

### 4.1 MeteoCalculationService

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MeteoCalculationServiceImpl implements MeteoCalculationService {

    private final ProjectIndicatorRepository indicatorRepo;
    private final MeteoHistoryRepository meteoHistoryRepo;
    private final ForcingRuleEngine forcingRuleEngine;
    private final MeteoConfigProperties config;
    private final CacheManager cacheManager;

    @Async
    @Transactional
    public MeteoHistory recalculate(UUID projectId) {
        log.info("Recalculating météo for project {}", projectId);

        // 1. Load all active indicators
        List<ProjectIndicator> indicators = indicatorRepo
            .findByProjectIdAndIsActiveTrue(projectId);

        if (indicators.isEmpty()) {
            log.warn("No active indicators for project {}", projectId);
            return null;
        }

        // 2. Calculate weighted scores
        double totalWeightedScore = 0;
        double totalWeight = 0;
        Map<String, Object> indicatorScores = new HashMap<>();

        for (ProjectIndicator indicator : indicators) {
            double weight = indicator.getWeight()
                * indicator.getCriticalityCoefficient();
            totalWeightedScore += indicator.getCurrentScore() * weight;
            totalWeight += weight;

            indicatorScores.put(indicator.getCode(), Map.of(
                "value", indicator.getCurrentValue(),
                "score", indicator.getCurrentScore(),
                "weight", indicator.getWeight(),
                "critCoeff", indicator.getCriticalityCoefficient()
            ));
        }

        double rawScore = totalWeight > 0
            ? totalWeightedScore / totalWeight
            : 0;

        // 3. Convert to météo
        MeteoState rawMeteo = convertToMeteo(rawScore);

        // 4. Apply forcing rules
        ForcingResult forcing = forcingRuleEngine.evaluate(projectId);

        MeteoState finalMeteo = forcing.isForced()
            ? MeteoState.ORAGE
            : rawMeteo;

        double finalScore = forcing.isForced()
            ? Math.min(rawScore, 49)  // Force below ORAGE threshold
            : rawScore;

        // 5. Generate explanation
        String explanation = generateExplanation(
            projectId, finalScore, finalMeteo, forcing, indicatorScores
        );

        // 6. Save history
        MeteoHistory history = MeteoHistory.builder()
            .projectId(projectId)
            .calculationDate(LocalDate.now())
            .meteoState(finalMeteo)
            .calculatedScore(BigDecimal.valueOf(finalScore))
            .rawScore(BigDecimal.valueOf(rawScore))
            .wasForced(forcing.isForced())
            .activeForcingRules(forcing.getRulesAsJson())
            .indicatorScores(indicatorScores)
            .explanation(explanation)
            .triggeredBy("AUTO")
            .build();

        meteoHistoryRepo.save(history);

        // 7. Invalidate cache
        evictMeteoCache(projectId);

        return history;
    }

    private MeteoState convertToMeteo(double score) {
        if (score >= config.getThresholds().getSoleil()) return MeteoState.SOLEIL;
        if (score >= config.getThresholds().getNuageClair()) return MeteoState.NUAGE_CLAIR;
        if (score >= config.getThresholds().getNuageCharge()) return MeteoState.NUAGE_CHARGE;
        return MeteoState.ORAGE;
    }

    public int calculateIndicatorScore(double value, ProjectIndicator indicator) {
        double green = indicator.getThresholdGreen().doubleValue();
        double orange = indicator.getThresholdOrange().doubleValue();
        double red = indicator.getThresholdRed().doubleValue();

        // Handle inverted indicators (lower is better)
        boolean inverted = indicator.getIndicatorLibrary().getIsInverted();
        if (inverted) {
            // For inverted: value <= green is best
            if (value <= green)  return (int)(80 + (green - value) / green * 20);
            if (value <= orange) return (int)(50 + (orange - value) / (orange - green) * 30);
            if (value <= red)    return (int)(20 + (red - value) / (red - orange) * 30);
            return (int)(Math.max(0, 20 - (value - red) / red * 20));
        }

        // Normal indicators (higher is better)
        if (value >= green)  return (int)(80 + Math.min((value - green) / (100 - green) * 20, 20));
        if (value >= orange) return (int)(50 + (value - orange) / (green - orange) * 30);
        if (value >= red)    return (int)(20 + (value - red) / (orange - red) * 30);
        return (int)(value / red * 20);
    }
}
```

### 4.2 ForcingRuleEngine

```java
@Service
@RequiredArgsConstructor
public class ForcingRuleEngine {

    private final ActionRepository actionRepo;
    private final ProjectRepository projectRepo;
    private final ProjectIndicatorRepository indicatorRepo;
    private final CorrectiveActionRepository correctiveRepo;
    private final MeteoConfigProperties config;

    public ForcingResult evaluate(UUID projectId) {
        List<ForcingRule> triggeredRules = new ArrayList<>();

        // R20: Blocked action > 5 days
        long blockedCount = actionRepo.countBlockedOverDays(
            projectId, config.getForcingRules().getBlockedActionDays()
        );
        if (blockedCount >= 1) {
            triggeredRules.add(new ForcingRule(
                "R20", ForcingRuleType.BLOCKED_ACTION,
                blockedCount + " action(s) bloquée(s) depuis plus de "
                    + config.getForcingRules().getBlockedActionDays() + " jours"
            ));
        }

        // R21: >= 30% late actions
        ActionStats stats = actionRepo.getActionStats(projectId);
        double latePercentage = stats.getTotal() > 0
            ? (double) stats.getLateCount() / stats.getTotal() * 100
            : 0;
        if (latePercentage >= config.getForcingRules().getLateActionsPercentage()) {
            triggeredRules.add(new ForcingRule(
                "R21", ForcingRuleType.LATE_ACTIONS,
                String.format("%.0f%% des actions en retard", latePercentage)
            ));
        }

        // R22: Budget > 120%
        Project project = projectRepo.findById(projectId).orElseThrow();
        if (project.getBudgetTotal().compareTo(BigDecimal.ZERO) > 0) {
            double budgetRatio = project.getBudgetConsumed()
                .divide(project.getBudgetTotal(), 4, RoundingMode.HALF_UP)
                .doubleValue() * 100;
            if (budgetRatio > config.getForcingRules().getBudgetOverrunPercentage()) {
                triggeredRules.add(new ForcingRule(
                    "R22", ForcingRuleType.BUDGET_OVERRUN,
                    String.format("Budget à %.0f%% du total", budgetRatio)
                ));
            }
        }

        // R23: Critical indicator without corrective action
        List<ProjectIndicator> criticalWithout = indicatorRepo
            .findCriticalWithoutCorrectiveAction(projectId);
        if (!criticalWithout.isEmpty()) {
            String codes = criticalWithout.stream()
                .map(i -> i.getIndicatorLibrary().getCode())
                .collect(Collectors.joining(", "));
            triggeredRules.add(new ForcingRule(
                "R23", ForcingRuleType.CRITICAL_NO_ACTION,
                "Indicateur(s) CRITICAL sans action corrective: " + codes
            ));
        }

        // R24: No update > 10 days
        long daysSinceUpdate = ChronoUnit.DAYS.between(
            project.getLastUpdateAt().atZone(ZoneOffset.UTC).toLocalDate(),
            LocalDate.now()
        );
        if (daysSinceUpdate > config.getForcingRules().getNoUpdateDays()) {
            triggeredRules.add(new ForcingRule(
                "R24", ForcingRuleType.NO_UPDATE,
                "Aucune mise à jour depuis " + daysSinceUpdate + " jours"
            ));
        }

        return new ForcingResult(!triggeredRules.isEmpty(), triggeredRules);
    }
}
```

### 4.3 Custom Repository Queries

```java
@Repository
public interface ActionRepository extends JpaRepository<Action, UUID> {

    @Query("SELECT COUNT(a) FROM Action a WHERE a.project.id = :projectId "
         + "AND a.status = 'BLOCKED' "
         + "AND a.blockedSince < :cutoffDate")
    long countBlockedOverDays(@Param("projectId") UUID projectId,
                              @Param("cutoffDate") LocalDate cutoffDate);

    @Query("SELECT new com.meteoproject.dto.ActionStats("
         + "COUNT(a), "
         + "SUM(CASE WHEN a.status != 'COMPLETED' AND a.plannedEnd < CURRENT_DATE THEN 1 ELSE 0 END), "
         + "SUM(CASE WHEN a.status = 'BLOCKED' THEN 1 ELSE 0 END), "
         + "SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END)) "
         + "FROM Action a WHERE a.project.id = :projectId")
    ActionStats getActionStats(@Param("projectId") UUID projectId);

    List<Action> findByProjectIdAndStatusNot(UUID projectId, ActionStatus status);

    @Query("SELECT a FROM Action a WHERE a.project.id = :projectId "
         + "AND a.status = 'BLOCKED' ORDER BY a.blockedSince ASC")
    List<Action> findBlockedActions(@Param("projectId") UUID projectId);
}

@Repository
public interface ProjectIndicatorRepository extends JpaRepository<ProjectIndicator, UUID> {

    List<ProjectIndicator> findByProjectIdAndIsActiveTrue(UUID projectId);

    @Query("SELECT pi FROM ProjectIndicator pi "
         + "WHERE pi.project.id = :projectId "
         + "AND pi.currentScore < 20 "
         + "AND NOT EXISTS (SELECT ca FROM CorrectiveAction ca "
         + "  WHERE ca.indicator.id = pi.id "
         + "  AND ca.status IN ('OPEN', 'IN_PROGRESS'))")
    List<ProjectIndicator> findCriticalWithoutCorrectiveAction(
        @Param("projectId") UUID projectId
    );
}
```

## 5. Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final JwtAuthenticationEntryPoint entryPoint;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigSource()))
            .sessionManagement(sm -> sm
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(entryPoint))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
```

## 6. Custom RBAC Annotation

```java
// Custom annotation for project-level role checking
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresProjectRole {
    Role[] value();
    String projectIdParam() default "projectId";
}

// AOP Aspect
@Aspect
@Component
@RequiredArgsConstructor
public class ProjectRoleAspect {

    private final UserProjectRoleRepository roleRepo;

    @Around("@annotation(requiresRole)")
    public Object checkRole(ProceedingJoinPoint joinPoint,
                            RequiresProjectRole requiresRole) throws Throwable {
        UUID userId = SecurityUtils.getCurrentUserId();
        UUID projectId = extractProjectId(joinPoint, requiresRole.projectIdParam());

        boolean hasRole = roleRepo.existsByUserIdAndProjectIdAndRoleInAndRemovedAtIsNull(
            userId, projectId, Arrays.asList(requiresRole.value())
        );

        if (!hasRole) {
            throw new ForbiddenException(
                "Rôle requis: " + Arrays.toString(requiresRole.value())
            );
        }

        return joinPoint.proceed();
    }
}

// Usage in controller
@PostMapping("/projects/{projectId}/indicators/{indicatorId}/values")
@RequiresProjectRole({Role.CHEF})
public ResponseEntity<IndicatorValueResponse> recordValue(
    @PathVariable UUID projectId,
    @PathVariable UUID indicatorId,
    @Valid @RequestBody RecordIndicatorValueRequest request
) { ... }
```

## 7. Global Exception Handler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(ErrorResponse.of(
            404, "Not Found", "RESOURCE_NOT_FOUND", ex.getMessage()
        ));
    }

    @ExceptionHandler(BusinessRuleViolationException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRule(BusinessRuleViolationException ex) {
        return ResponseEntity.status(400).body(ErrorResponse.of(
            400, "Bad Request", "BUSINESS_RULE_VIOLATION", ex.getMessage(),
            Map.of("rule", ex.getRule(), "field", ex.getField())
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
            errors.put(err.getField(), err.getDefaultMessage())
        );
        return ResponseEntity.status(400).body(ErrorResponse.of(
            400, "Bad Request", "VALIDATION_ERROR",
            "Erreur de validation", errors
        ));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(403).body(ErrorResponse.of(
            403, "Forbidden", "FORBIDDEN", ex.getMessage()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(500).body(ErrorResponse.of(
            500, "Internal Server Error", "INTERNAL_ERROR",
            "Une erreur interne est survenue"
        ));
    }
}
```

## 8. Testing Strategy

### 8.1 Unit Tests (JUnit 5 + Mockito)
```java
@ExtendWith(MockitoExtension.class)
class MeteoCalculationServiceTest {

    @InjectMocks
    private MeteoCalculationServiceImpl service;

    @Mock
    private ProjectIndicatorRepository indicatorRepo;
    @Mock
    private ForcingRuleEngine forcingEngine;

    @Test
    void calculateIndicatorScore_valueAboveGreen_returnsExcellentScore() {
        // Given
        ProjectIndicator indicator = buildIndicator(90, 75, 50, false);
        // When
        int score = service.calculateIndicatorScore(95, indicator);
        // Then
        assertThat(score).isBetween(80, 100);
    }

    @Test
    void calculateIndicatorScore_invertedIndicator_lowerIsBetter() {
        // Given: taux de défauts (lower = better)
        ProjectIndicator indicator = buildIndicator(5, 15, 30, true);
        // When
        int score = service.calculateIndicatorScore(3, indicator);
        // Then
        assertThat(score).isGreaterThan(80);
    }

    @Test
    void recalculate_withForcingRule_returnsOrage() {
        // Given
        when(indicatorRepo.findByProjectIdAndIsActiveTrue(any()))
            .thenReturn(List.of(buildIndicatorWithScore(85)));
        when(forcingEngine.evaluate(any()))
            .thenReturn(ForcingResult.forced(List.of(
                new ForcingRule("R20", ...)
            )));
        // When
        MeteoHistory result = service.recalculate(projectId);
        // Then
        assertThat(result.getMeteoState()).isEqualTo(MeteoState.ORAGE);
        assertThat(result.getWasForced()).isTrue();
    }
}
```

### 8.2 Integration Tests (Testcontainers)
```java
@SpringBootTest
@Testcontainers
@AutoConfigureMockMvc
class ProjectControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("meteo_test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createProject_asDirector_returns201() throws Exception {
        String jwt = generateJwtForRole(Role.DIRECTOR);

        mockMvc.perform(post("/api/v1/projects")
                .header("Authorization", "Bearer " + jwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Test Project",
                      "code": "TST-001",
                      "startDate": "2026-05-01",
                      "endDate": "2026-12-31",
                      "budgetTotal": 100000,
                      "type": "APPLICATION",
                      "criticality": "MEDIUM"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Test Project"))
            .andExpect(jsonPath("$.status").value("PREPARATION"));
    }
}
```

## 9. Flyway Migration Files Structure

```
src/main/resources/db/migration/
├── V1__initial_schema.sql          # Tables, enums, indexes
├── V2__seed_indicator_library.sql  # Default indicators
├── V3__add_views.sql               # Database views
├── V4__add_notification_prefs.sql  # Notification table
└── V5__add_refresh_tokens.sql      # Refresh tokens
```
