// ============================================
// Auth
// ============================================

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// ============================================
// User
// ============================================

export interface User {
  id: string;            // UUID string
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'SPONSOR' | 'DIRECTOR' | 'CHEF' | 'MEMBER' | 'OBSERVER';

// ============================================
// Project — mirrors backend ProjectResponse.java
// ============================================

export type ProjectStatus = 'PREPARATION' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
export type Criticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Visibility = 'PUBLIC' | 'RESTRICTED' | 'PRIVATE';
export type MeteoState = 'SOLEIL' | 'NUAGE_CLAIR' | 'NUAGE_CHARGE' | 'ORAGE';

export interface Project {
  id: string;
  name: string;
  code: string;
  shortDescription?: string;
  longDescription?: string;
  type: string;
  status: ProjectStatus;
  criticality: Criticality;
  visibility: Visibility;
  startDate: string;
  endDate: string;
  budgetTotal: number;
  budgetConsumed: number;
  chefName?: string;
  sponsorName?: string;
  directorName?: string;
  daysRemaining: number;
  memberCount: number;
  currentMeteoState?: MeteoState;
  currentMeteoScore?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Meteo
// ============================================

export interface MeteoEntry {
  id: string;
  projectId: string;
  state: MeteoState;
  score: number;
  forced: boolean;
  forcingRule?: string;
  calculatedAt: string;
  cqdScore?: number;
  indicatorScore?: number;
  riskScore?: number;
  planScore?: number;
}

// ============================================
// CQD (Cost, Quality, Deadline)
// ============================================

export type CQDAxisState = 'ALIGNED' | 'UNDER_TENSION' | 'DEGRADED';

export interface CQDAxis {
  axis: 'COST' | 'QUALITY' | 'DELAY';
  state: CQDAxisState;
  score: number;
  trend: 'UP' | 'STABLE' | 'DOWN';
  details: string;
}

export interface CQDResult {
  id: string;
  projectId: string;
  axes: CQDAxis[];
  globalScore: number;
  calculatedAt: string;
}

// ============================================
// Projection
// ============================================

export interface ScenarioResult {
  name: string;
  probability: number;
  projectedState: MeteoState;
  projectedScore: number;
  projectedProgress: number;
  completionDate: string;
  budgetAtCompletion: number;
}

export interface LayerScore {
  layerName: string;
  weight: number;
  score: number;
  confidence: number;
  explanation: string;
}

export interface LayerBreakdown {
  trend: LayerScore;
  simulation: LayerScore;
  actionPlan: LayerScore;
  risk: LayerScore;
  capacity: LayerScore;
  compositeScore: number;
}

export interface RecommendationItem {
  category: string;
  priority: string;
  action: string;
  expectedImpact: string;
}

export interface ProjectionResult {
  id: string;
  projectId: string;
  horizonDays: number;
  calculatedAt: string;
  nominalScenario: ScenarioResult;
  optimisticScenario: ScenarioResult;
  pessimisticScenario: ScenarioResult;
  confidence: number;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  layerBreakdown: LayerBreakdown;
  explanations: string[];
  recommendations: RecommendationItem[];
}

// ============================================
// Risk
// ============================================

export type RiskCategory = 'TECHNICAL' | 'ORGANIZATIONAL' | 'EXTERNAL' | 'FINANCIAL' | 'SCHEDULE';
export type RiskStatus = 'IDENTIFIED' | 'ACTIVE' | 'MITIGATED' | 'CLOSED';

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  probability: number;   // 1-5
  impact: number;        // 1-5
  severity: number;      // probability * impact
  status: RiskStatus;
  mitigationPlan?: string;
  responsibleId?: string;
  responsibleName?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Corrective Action
// ============================================

export type CorrectivePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CorrectiveStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export interface CorrectiveAction {
  id: string;
  title: string;
  description: string;
  priority: CorrectivePriority;
  status: CorrectiveStatus;
  responsibleId?: string;
  responsibleName?: string;
  deadline?: string;
  resolvedAt?: string;
  expectedImpact?: string;
  createdAt: string;
}

// ============================================
// Indicator
// ============================================

export type IndicatorCategory = 'PROGRESS' | 'BUDGET' | 'RISK' | 'QUALITY' | 'RESOURCE';
export type IndicatorState = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface ProjectIndicator {
  id: string;
  indicatorCode: string;
  indicatorName: string;
  category: IndicatorCategory;
  currentValue: number | null;
  thresholdGreen: number;
  thresholdOrange: number;
  thresholdRed: number;
  score: number | null;
  state: IndicatorState | null;
  weight: number;
  criticality: string;
  frequency: string;
  lastUpdatedAt: string | null;
}

// ============================================
// Plan / Action
// ============================================

export type ActionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'ON_HOLD';

export interface ActionResponse {
  id: string;
  title: string;
  description?: string;
  moduleId: string;
  moduleName?: string;
  status: ActionStatus;
  responsible?: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  progress: number;
  isMilestone: boolean;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Pagination
// ============================================

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
