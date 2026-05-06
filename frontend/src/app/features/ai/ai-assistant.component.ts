import { Component, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, NLExtractionResult, AIRecommendationsResult, FilePreviewResult } from '../../core/services/ai.service';
import { NotificationService } from '../../core/services/notification.service';

type AiTab = 'import' | 'analyze' | 'recommendations';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-panel">
      <!-- Header -->
      <div class="ai-header">
        <div class="ai-title">
          <div class="ai-orb-wrap">
            <div class="ai-orb-ring"></div>
            <span class="ai-orb">⚡</span>
          </div>
          <div>
            <h2>Moteur IA Météo</h2>
            <p class="ai-subtitle">Intelligence locale · Analyse en temps réel</p>
          </div>
          <div class="ai-status" [class.online]="aiOnline()">
            <span class="status-dot"></span>
            {{ aiOnline() ? 'En ligne' : 'Hors ligne' }}
          </div>
        </div>
        <div class="ai-tabs">
          <button class="ai-tab" [class.active]="tab() === 'import'" (click)="tab.set('import')">
            <span class="tab-icon">📁</span> Import
          </button>
          <button class="ai-tab" [class.active]="tab() === 'analyze'" (click)="tab.set('analyze')">
            <span class="tab-icon">🔍</span> Analyse
          </button>
          <button class="ai-tab" [class.active]="tab() === 'recommendations'" (click)="tab.set('recommendations')">
            <span class="tab-icon">🎯</span> Recommandations
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════ -->
      <!-- TAB: IMPORT — Smart File Ingestion             -->
      <!-- ═══════════════════════════════════════════════ -->
      @if (tab() === 'import') {
        <div class="import-area">
          <!-- Step 1: Upload Zone -->
          @if (!ingestionResult() && !ingesting()) {
            <div class="upload-zone"
                 [class.drag-over]="isDragOver()"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)"
                 (click)="fileInput.click()">
              <input #fileInput type="file" hidden
                     accept=".csv,.xlsx,.xls,.pdf,.txt,.md"
                     (change)="onFileSelect($event)" />

              <div class="upload-content">
                <div class="upload-icon-wrap">
                  <div class="upload-icon-bg"></div>
                  <span class="upload-icon">{{ isDragOver() ? '📥' : '📂' }}</span>
                </div>
                <p class="upload-title">{{ isDragOver() ? 'Déposez le fichier ici' : 'Importez vos données projet' }}</p>
                <p class="upload-desc">Glissez-déposez un fichier ou cliquez pour parcourir</p>
                <div class="upload-formats">
                  <span class="format-badge">📊 Excel</span>
                  <span class="format-badge">📄 CSV</span>
                  <span class="format-badge">📕 PDF</span>
                  <span class="format-badge">📝 Texte</span>
                </div>
                <p class="upload-limit">Maximum 10 Mo</p>
              </div>
            </div>

            <!-- Or paste text -->
            <div class="or-divider"><span>ou saisissez du texte</span></div>

            <div class="text-input-section">
              <div class="form-group">
                <label>Nom du projet (optionnel)</label>
                <input type="text" class="input" [(ngModel)]="importProjectName"
                       placeholder="Ex: Projet ERP Migration" />
              </div>
              <div class="form-group">
                <label>Description / Notes / Compte-rendu</label>
                <textarea class="input textarea" rows="5" [(ngModel)]="importText"
                  placeholder="Collez ici un CR de comité, un email de reporting, des notes de réunion...">
                </textarea>
              </div>
              <button class="btn-analyze" (click)="analyzeText()" [disabled]="!importText.trim()">
                ⚡ Analyser le texte
              </button>
            </div>
          }

          <!-- Step 2: File Preview (before analysis) -->
          @if (filePreview() && !ingestionResult() && !ingesting()) {
            <div class="file-preview">
              <div class="preview-header">
                <div class="preview-file-info">
                  <span class="file-type-icon">{{ fileTypeIcon(filePreview()!.fileType) }}</span>
                  <div>
                    <p class="preview-filename">{{ filePreview()!.fileName }}</p>
                    <p class="preview-meta">{{ filePreview()!.fileType.toUpperCase() }} · {{ formatSize(filePreview()!.fileSize) }} · {{ filePreview()!.extractedChars }} caractères extraits</p>
                  </div>
                </div>
                <button class="btn-clear" (click)="clearFile()">✕</button>
              </div>

              <div class="preview-content">
                <pre>{{ filePreview()!.preview }}</pre>
              </div>

              <div class="preview-actions">
                <div class="form-group inline">
                  <input type="text" class="input" [(ngModel)]="importProjectName" placeholder="Nom du projet (optionnel)" />
                </div>
                <button class="btn-analyze large" (click)="runIngestion()">
                  ⚡ Lancer l'analyse IA
                </button>
              </div>
            </div>
          }

          <!-- Step 2b: Analyzing... -->
          @if (ingesting()) {
            <div class="ingesting-state">
              <div class="ingest-visual">
                <div class="ingest-ring r1"></div>
                <div class="ingest-ring r2"></div>
                <div class="ingest-ring r3"></div>
                <span class="ingest-icon">🧠</span>
              </div>
              <div class="ingest-status">
                <p class="ingest-title">Analyse IA en cours</p>
                <p class="ingest-step">{{ ingestStep() }}</p>
                <div class="ingest-progress">
                  <div class="ingest-bar" [style.width.%]="ingestProgress()"></div>
                </div>
              </div>
            </div>
          }

          <!-- Step 3: Results -->
          @if (ingestionResult()) {
            <div class="ingestion-results">
              <!-- Source badge -->
              @if (ingestionResult()!._source) {
                <div class="source-badge">
                  <span>{{ fileTypeIcon(ingestionResult()!._source!.fileType) }}</span>
                  {{ ingestionResult()!._source!.fileName }} · {{ formatSize(ingestionResult()!._source!.fileSize) }}
                </div>
              }

              <!-- Health overview -->
              <div class="health-overview">
                <div class="health-main">
                  <span class="health-icon">{{ healthIcon(ingestionResult()!.overall_health) }}</span>
                  <div>
                    <span class="health-state">{{ healthLabel(ingestionResult()!.overall_health) }}</span>
                    <span class="health-confidence">Confiance: {{ (ingestionResult()!.confidence * 100).toFixed(0) }}%</span>
                  </div>
                </div>
                <p class="analysis-summary">{{ ingestionResult()!.summary }}</p>
              </div>

              <!-- Quick stats bar -->
              <div class="quick-stats">
                <div class="qs-item">
                  <span class="qs-value">{{ ingestionResult()!.indicators.length || 0 }}</span>
                  <span class="qs-label">Indicateurs</span>
                </div>
                <div class="qs-item">
                  <span class="qs-value">{{ ingestionResult()!.risks.length || 0 }}</span>
                  <span class="qs-label">Risques</span>
                </div>
                <div class="qs-item">
                  <span class="qs-value">{{ ingestionResult()!.corrective_actions.length || 0 }}</span>
                  <span class="qs-label">Actions</span>
                </div>
                <div class="qs-item">
                  <span class="qs-value">{{ ingestionResult()!.milestones?.length || 0 }}</span>
                  <span class="qs-label">Jalons</span>
                </div>
              </div>

              <!-- Budget & Timeline -->
              @if (ingestionResult()!.budget || ingestionResult()!.timeline) {
                <div class="meta-cards">
                  @if (ingestionResult()!.budget) {
                    <div class="meta-card">
                      <h4>💰 Budget</h4>
                      <div class="meta-row">
                        <span>Prévu:</span> <strong>{{ ingestionResult()!.budget!.planned }} {{ ingestionResult()!.budget!.unit }}</strong>
                      </div>
                      <div class="meta-row">
                        <span>Consommé:</span> <strong>{{ ingestionResult()!.budget!.consumed }} {{ ingestionResult()!.budget!.unit }}</strong>
                      </div>
                      @if (ingestionResult()!.budget!.burnRate) {
                        <div class="meta-row">
                          <span>Rythme:</span> <strong>{{ ingestionResult()!.budget!.burnRate }}</strong>
                        </div>
                      }
                    </div>
                  }
                  @if (ingestionResult()!.timeline) {
                    <div class="meta-card">
                      <h4>📅 Calendrier</h4>
                      @if (ingestionResult()!.timeline!.startDate) {
                        <div class="meta-row"><span>Début:</span> <strong>{{ ingestionResult()!.timeline!.startDate }}</strong></div>
                      }
                      @if (ingestionResult()!.timeline!.endDate) {
                        <div class="meta-row"><span>Fin prévue:</span> <strong>{{ ingestionResult()!.timeline!.endDate }}</strong></div>
                      }
                      @if (ingestionResult()!.timeline!.delayDays) {
                        <div class="meta-row delay"><span>Retard:</span> <strong>{{ ingestionResult()!.timeline!.delayDays }} jours</strong></div>
                      }
                    </div>
                  }
                </div>
              }

              <!-- Team signals -->
              @if (ingestionResult()!.team_signals) {
                <div class="team-card">
                  <h4>👥 Signaux Équipe</h4>
                  <div class="team-badges">
                    <span class="team-badge" [class]="'wl-' + ingestionResult()!.team_signals!.workload.toLowerCase()">
                      Charge: {{ ingestionResult()!.team_signals!.workload }}
                    </span>
                    <span class="team-badge" [class]="'mr-' + ingestionResult()!.team_signals!.morale.toLowerCase()">
                      Moral: {{ ingestionResult()!.team_signals!.morale }}
                    </span>
                  </div>
                  @if (ingestionResult()!.team_signals!.notes) {
                    <p class="team-notes">{{ ingestionResult()!.team_signals!.notes }}</p>
                  }
                </div>
              }

              <!-- Indicators -->
              @if (ingestionResult()!.indicators.length) {
                <div class="result-section">
                  <h3 class="section-heading"><span>📊</span> Indicateurs <span class="count-badge">{{ ingestionResult()!.indicators.length }}</span></h3>
                  <div class="indicators-grid">
                    @for (ind of ingestionResult()!.indicators; track ind.name) {
                      <div class="indicator-card" [class]="'state-' + ind.state.toLowerCase()">
                        <div class="ind-top">
                          <span class="ind-state-dot"></span>
                          <span class="ind-name">{{ ind.name }}</span>
                          <span class="ind-trend">{{ trendIcon(ind.trend) }}</span>
                        </div>
                        <div class="ind-values">
                          <span class="ind-current">{{ ind.currentValue }}{{ ind.unit }}</span>
                          <span class="ind-separator">→</span>
                          <span class="ind-target">{{ ind.targetValue }}{{ ind.unit }}</span>
                        </div>
                        <span class="ind-category">{{ ind.category }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Risks -->
              @if (ingestionResult()!.risks.length) {
                <div class="result-section">
                  <h3 class="section-heading"><span>⚠️</span> Risques <span class="count-badge danger">{{ ingestionResult()!.risks.length }}</span></h3>
                  @for (risk of ingestionResult()!.risks; track risk.title) {
                    <div class="risk-card" [class]="'sev-' + getSevClass(risk.severity)">
                      <div class="risk-top">
                        <span class="risk-name">{{ risk.title }}</span>
                        <div class="risk-badges">
                          <span class="sev-badge">{{ risk.severity }}/25</span>
                          <span class="risk-status-badge">{{ risk.status }}</span>
                        </div>
                      </div>
                      <p class="risk-desc">{{ risk.description }}</p>
                      <div class="risk-meta">
                        <span>P:{{ risk.probability }}</span><span class="risk-sep">×</span><span>I:{{ risk.impact }}</span>
                        <span class="risk-cat">{{ risk.category }}</span>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Actions -->
              @if (ingestionResult()!.corrective_actions.length) {
                <div class="result-section">
                  <h3 class="section-heading"><span>✅</span> Actions <span class="count-badge success">{{ ingestionResult()!.corrective_actions.length }}</span></h3>
                  @for (action of ingestionResult()!.corrective_actions; track action.title) {
                    <div class="action-card" [class]="'prio-' + action.priority.toLowerCase()">
                      <div class="action-top">
                        <span class="prio-badge" [class]="'badge-' + action.priority.toLowerCase()">{{ action.priority }}</span>
                        <span class="action-name">{{ action.title }}</span>
                      </div>
                      <p class="action-desc">{{ action.description }}</p>
                      <div class="action-bottom">
                        <span class="action-impact">🎯 {{ action.expectedImpact }}</span>
                        @if (action.assignee) { <span class="action-assignee">👤 {{ action.assignee }}</span> }
                        @if (action.deadline) { <span class="action-deadline">📅 {{ action.deadline }}</span> }
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Milestones -->
              @if (ingestionResult()!.milestones?.length) {
                <div class="result-section">
                  <h3 class="section-heading"><span>🏁</span> Jalons <span class="count-badge">{{ ingestionResult()!.milestones!.length }}</span></h3>
                  <div class="milestones-list">
                    @for (ms of ingestionResult()!.milestones!; track ms.name) {
                      <div class="milestone" [class]="'ms-' + ms.status.toLowerCase()">
                        <span class="ms-dot"></span>
                        <span class="ms-name">{{ ms.name }}</span>
                        <span class="ms-date">{{ ms.date }}</span>
                        <span class="ms-status">{{ ms.status }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Raw observations -->
              @if (ingestionResult()!.raw_observations?.length) {
                <div class="result-section">
                  <h3 class="section-heading"><span>💡</span> Observations clés</h3>
                  <div class="observations">
                    @for (obs of ingestionResult()!.raw_observations!; track obs) {
                      <p class="obs-item">• {{ obs }}</p>
                    }
                  </div>
                </div>
              }

              <!-- Action buttons -->
              <div class="result-actions">
                <button class="btn-apply" (click)="applyIngestion()">✅ Appliquer au projet</button>
                <button class="btn-secondary" (click)="resetImport()">🔄 Nouvelle analyse</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ═══════════════════════════════════════════════ -->
      <!-- TAB: ANALYZE — Text-based analysis             -->
      <!-- ═══════════════════════════════════════════════ -->
      @if (tab() === 'analyze') {
        <div class="analyze-area">
          <div class="analyze-intro">
            <div class="intro-icon">📋</div>
            <div>
              <p class="intro-title">Analyse de situation</p>
              <p class="intro-desc">Décrivez la situation de votre projet en langage naturel. L'IA extraira automatiquement les indicateurs, risques et actions correctives.</p>
            </div>
          </div>
          <div class="input-section">
            <textarea class="analyze-input" rows="5" [(ngModel)]="analyzeInput"
              placeholder="Ex: L'API est en retard de 2 semaines, le module de paiement est bloqué par un problème de sécurité. Le budget est à 85% consommé mais il reste 40% du travail..."
              (keydown.control.enter)="runAnalysis()"></textarea>
            <button class="btn-analyze" (click)="runAnalysis()" [disabled]="analyzing() || !analyzeInput.trim()">
              @if (analyzing()) { <span class="btn-spinner"></span> Analyse en cours... }
              @else { ⚡ Analyser la situation }
            </button>
          </div>
          @if (analysisResult()) {
            <div class="analysis-output">
              <div class="health-overview">
                <div class="health-main">
                  <span class="health-icon">{{ healthIcon(analysisResult()!.overall_health) }}</span>
                  <div>
                    <span class="health-state">{{ healthLabel(analysisResult()!.overall_health) }}</span>
                    <span class="health-confidence">Confiance: {{ (analysisResult()!.confidence * 100).toFixed(0) }}%</span>
                  </div>
                </div>
                <p class="analysis-summary">{{ analysisResult()!.summary }}</p>
              </div>
              @if (analysisResult()!.indicators.length) {
                <div class="result-section">
                  <h3 class="section-heading"><span>📊</span> Indicateurs <span class="count-badge">{{ analysisResult()!.indicators.length }}</span></h3>
                  <div class="indicators-grid">
                    @for (ind of analysisResult()!.indicators; track ind.name) {
                      <div class="indicator-card" [class]="'state-' + ind.state.toLowerCase()">
                        <div class="ind-top"><span class="ind-state-dot"></span><span class="ind-name">{{ ind.name }}</span><span class="ind-trend">{{ trendIcon(ind.trend) }}</span></div>
                        <div class="ind-values"><span class="ind-current">{{ ind.currentValue }}{{ ind.unit }}</span><span class="ind-separator">→</span><span class="ind-target">{{ ind.targetValue }}{{ ind.unit }}</span></div>
                        <span class="ind-category">{{ ind.category }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
              @if (analysisResult()!.risks.length) {
                <div class="result-section">
                  <h3 class="section-heading"><span>⚠️</span> Risques <span class="count-badge danger">{{ analysisResult()!.risks.length }}</span></h3>
                  @for (risk of analysisResult()!.risks; track risk.title) {
                    <div class="risk-card" [class]="'sev-' + getSevClass(risk.severity)">
                      <div class="risk-top"><span class="risk-name">{{ risk.title }}</span><span class="sev-badge">{{ risk.severity }}/25</span></div>
                      <p class="risk-desc">{{ risk.description }}</p>
                    </div>
                  }
                </div>
              }
              @if (analysisResult()!.corrective_actions.length) {
                <div class="result-section">
                  <h3 class="section-heading"><span>✅</span> Actions <span class="count-badge success">{{ analysisResult()!.corrective_actions.length }}</span></h3>
                  @for (action of analysisResult()!.corrective_actions; track action.title) {
                    <div class="action-card" [class]="'prio-' + action.priority.toLowerCase()">
                      <div class="action-top"><span class="prio-badge" [class]="'badge-' + action.priority.toLowerCase()">{{ action.priority }}</span><span class="action-name">{{ action.title }}</span></div>
                      <p class="action-desc">{{ action.description }}</p>
                      <p class="action-impact">🎯 {{ action.expectedImpact }}</p>
                    </div>
                  }
                </div>
              }
              <button class="btn-apply" (click)="applyIngestion()">✅ Appliquer ces données au projet</button>
            </div>
          }
        </div>
      }

      <!-- ═══════════════════════════════════════════════ -->
      <!-- TAB: RECOMMENDATIONS                           -->
      <!-- ═══════════════════════════════════════════════ -->
      @if (tab() === 'recommendations') {
        <div class="reco-area">
          @if (loadingRecos()) {
            <div class="loading-state">
              <div class="ai-pulse-loader"><div class="pulse-ring"></div><div class="pulse-ring delay"></div><span class="pulse-icon">⚡</span></div>
              <p>L'IA analyse votre projet...</p>
            </div>
          } @else if (recos()) {
            <div class="recos-result">
              <div class="urgency-banner" [class]="'urgency-' + recos()!.urgency.toLowerCase()">
                <span class="urgency-icon">{{ urgencyIcon(recos()!.urgency) }}</span>
                <div><p class="urgency-label">{{ urgencyLabel(recos()!.urgency) }}</p><p class="urgency-summary">{{ recos()!.summary }}</p></div>
              </div>
              <div class="recos-list">
                @for (r of recos()!.recommendations; track r.title; let i = $index) {
                  <div class="reco-card" [class]="'reco-prio-' + r.priority.toLowerCase()">
                    <div class="reco-number">{{ i + 1 }}</div>
                    <div class="reco-content">
                      <div class="reco-top">
                        <span class="reco-prio-badge" [class]="'badge-' + r.priority.toLowerCase()">{{ r.priority }}</span>
                        <span class="reco-category">{{ r.category }}</span>
                        @if (r.timeframe) { <span class="reco-timeframe">⏱ {{ r.timeframe }}</span> }
                      </div>
                      <h4 class="reco-title">{{ r.title }}</h4>
                      <p class="reco-desc">{{ r.description }}</p>
                      <div class="reco-impact">🎯 <em>{{ r.expectedImpact }}</em></div>
                    </div>
                  </div>
                }
              </div>
              <div class="signals-row">
                @if (recos()!.warning_signs.length) {
                  <div class="signals-card danger"><h4>⚠️ Signaux d'alerte</h4>@for (w of recos()!.warning_signs; track w) { <p>• {{ w }}</p> }</div>
                }
                @if (recos()!.positive_points.length) {
                  <div class="signals-card success"><h4>✅ Points positifs</h4>@for (p of recos()!.positive_points; track p) { <p>• {{ p }}</p> }</div>
                }
              </div>
              <button class="btn-secondary" (click)="loadRecos()">🔄 Actualiser l'analyse</button>
            </div>
          } @else {
            <div class="empty-reco">
              <div class="empty-icon">🎯</div>
              <p class="empty-title">Recommandations IA</p>
              <p class="empty-desc">L'IA analysera votre projet et proposera des recommandations concrètes, classées par priorité et impact.</p>
              <button class="btn-analyze" (click)="loadRecos()">⚡ Générer les recommandations</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════ */
    /* Panel                                               */
    /* ═══════════════════════════════════════════════════ */
    .ai-panel { display: flex; flex-direction: column; height: 100%; background: #fff; border-radius: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); overflow: hidden; }

    .ai-header { background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%); padding: 24px 28px 0; }
    .ai-title { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
    .ai-orb-wrap { position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
    .ai-orb { font-size: 24px; z-index: 1; }
    .ai-orb-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(255,107,0,0.4); animation: pulse-ring 2s ease-out infinite; }
    @keyframes pulse-ring { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
    .ai-title h2 { font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 3px; }
    .ai-subtitle { font-size: 12px; color: rgba(255,255,255,0.45); margin: 0; letter-spacing: 0.3px; }
    .ai-status { margin-left: auto; display: flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; }
    .ai-status .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #ef4444; flex-shrink: 0; }
    .ai-status.online .status-dot { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.5); }
    .ai-status.online { color: rgba(255,255,255,0.7); }

    .ai-tabs { display: flex; gap: 4px; }
    .ai-tab { padding: 10px 18px; border: none; background: transparent; color: rgba(255,255,255,0.45); font-size: 13px; font-weight: 500; cursor: pointer; border-radius: 10px 10px 0 0; transition: all 0.25s; display: flex; align-items: center; gap: 6px; }
    .ai-tab:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
    .ai-tab.active { background: #fff; color: #1a1a2e; font-weight: 600; }
    .tab-icon { font-size: 14px; }

    /* ─── Shared ──────────────────────────────────────── */
    .import-area, .analyze-area, .reco-area { padding: 24px; overflow-y: auto; flex: 1; }

    /* ─── UPLOAD ZONE ─────────────────────────────────── */
    .upload-zone {
      border: 2px dashed #d1d5db; border-radius: 16px; padding: 48px 32px;
      cursor: pointer; transition: all 0.3s; text-align: center;
      background: linear-gradient(135deg, #fafafa, #f5f5f5);
    }
    .upload-zone:hover { border-color: #FF6B00; background: linear-gradient(135deg, #fff7f0, #fef3e8); }
    .upload-zone.drag-over {
      border-color: #FF6B00; border-style: solid;
      background: linear-gradient(135deg, #fff3e0, #ffe0b2);
      transform: scale(1.01); box-shadow: 0 8px 32px rgba(255,107,0,0.15);
    }
    .upload-content { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .upload-icon-wrap { position: relative; width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; }
    .upload-icon-bg {
      position: absolute; inset: 0; border-radius: 50%;
      background: linear-gradient(135deg, rgba(255,107,0,0.08), rgba(255,107,0,0.15));
      animation: breathe 3s ease-in-out infinite;
    }
    @keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    .upload-icon { font-size: 32px; z-index: 1; }
    .upload-title { font-size: 17px; font-weight: 700; color: #1a1a2e; margin: 0; }
    .upload-desc { font-size: 13px; color: #9ca3af; margin: 0; }
    .upload-formats { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
    .format-badge { font-size: 11px; padding: 4px 10px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; color: #6b7280; }
    .upload-limit { font-size: 11px; color: #c0c4cc; margin: 0; }

    .or-divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; }
    .or-divider::before, .or-divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
    .or-divider span { font-size: 12px; color: #9ca3af; white-space: nowrap; }

    /* ─── File Preview ────────────────────────────────── */
    .file-preview { background: #f9fafb; border-radius: 14px; border: 1px solid #e5e7eb; overflow: hidden; }
    .preview-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #fff; border-bottom: 1px solid #f0f0f0; }
    .preview-file-info { display: flex; align-items: center; gap: 12px; }
    .file-type-icon { font-size: 28px; }
    .preview-filename { font-size: 14px; font-weight: 600; color: #1a1a2e; margin: 0; }
    .preview-meta { font-size: 11px; color: #9ca3af; margin: 2px 0 0; }
    .btn-clear { width: 32px; height: 32px; border: none; background: #f3f4f6; border-radius: 8px; font-size: 14px; cursor: pointer; color: #6b7280; transition: all 0.2s; }
    .btn-clear:hover { background: #fee2e2; color: #ef4444; }
    .preview-content { max-height: 200px; overflow-y: auto; padding: 16px 20px; }
    .preview-content pre { font-size: 11px; color: #6b7280; white-space: pre-wrap; word-break: break-word; margin: 0; font-family: 'SF Mono', 'Fira Code', monospace; line-height: 1.5; }
    .preview-actions { display: flex; gap: 12px; padding: 16px 20px; background: #fff; border-top: 1px solid #f0f0f0; align-items: center; }
    .form-group.inline { flex: 1; margin: 0; }

    /* ─── Ingesting animation ─────────────────────────── */
    .ingesting-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 340px; gap: 28px; }
    .ingest-visual { position: relative; width: 96px; height: 96px; display: flex; align-items: center; justify-content: center; }
    .ingest-ring { position: absolute; border-radius: 50%; border: 2px solid transparent; animation: spin-ring 2s linear infinite; }
    .ingest-ring.r1 { inset: 0; border-top-color: #FF6B00; border-right-color: #FF6B00; }
    .ingest-ring.r2 { inset: 8px; border-bottom-color: #3b82f6; border-left-color: #3b82f6; animation-direction: reverse; animation-duration: 1.5s; }
    .ingest-ring.r3 { inset: 16px; border-top-color: #10b981; animation-duration: 1s; }
    @keyframes spin-ring { to { transform: rotate(360deg); } }
    .ingest-icon { font-size: 32px; z-index: 1; }
    .ingest-status { text-align: center; }
    .ingest-title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 0 0 6px; }
    .ingest-step { font-size: 13px; color: #6b7280; margin: 0 0 14px; }
    .ingest-progress { width: 220px; height: 4px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .ingest-bar { height: 100%; background: linear-gradient(90deg, #FF6B00, #ff8c33); border-radius: 4px; transition: width 0.5s ease; }

    /* ─── Results ──────────────────────────────────────── */
    .ingestion-results, .analysis-output { display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.4s ease; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    .source-badge { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; color: #6b7280; background: #f3f4f6; padding: 6px 12px; border-radius: 8px; align-self: flex-start; }

    .health-overview { background: #f9fafb; border-radius: 14px; padding: 18px 20px; border: 1px solid #f0f0f0; }
    .health-main { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
    .health-icon { font-size: 36px; }
    .health-state { display: block; font-size: 16px; font-weight: 700; color: #1a1a2e; }
    .health-confidence { display: block; font-size: 12px; color: #9ca3af; margin-top: 2px; }
    .analysis-summary { font-size: 14px; color: #4b5563; margin: 0; line-height: 1.6; }

    .quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .qs-item { background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 14px; text-align: center; }
    .qs-value { display: block; font-size: 24px; font-weight: 800; color: #FF6B00; }
    .qs-label { display: block; font-size: 11px; color: #9ca3af; margin-top: 2px; }

    /* Meta cards (budget, timeline) */
    .meta-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .meta-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 16px; }
    .meta-card h4 { font-size: 13px; font-weight: 700; margin: 0 0 10px; color: #1a1a2e; }
    .meta-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 4px 0; color: #6b7280; }
    .meta-row strong { color: #374151; }
    .meta-row.delay strong { color: #ef4444; }

    /* Team */
    .team-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 16px; }
    .team-card h4 { font-size: 13px; font-weight: 700; margin: 0 0 10px; color: #1a1a2e; }
    .team-badges { display: flex; gap: 8px; margin-bottom: 8px; }
    .team-badge { font-size: 11px; padding: 4px 10px; border-radius: 8px; font-weight: 600; }
    .wl-balanced { background: #d1fae5; color: #065f46; }
    .wl-overloaded { background: #fee2e2; color: #7f1d1d; }
    .wl-underloaded { background: #dbeafe; color: #1e3a8a; }
    .mr-high { background: #d1fae5; color: #065f46; }
    .mr-normal { background: #f3f4f6; color: #374151; }
    .mr-low { background: #fef3c7; color: #78350f; }
    .mr-unknown { background: #f3f4f6; color: #9ca3af; }
    .team-notes { font-size: 12px; color: #6b7280; margin: 0; line-height: 1.4; }

    /* Milestones */
    .milestones-list { display: flex; flex-direction: column; gap: 6px; }
    .milestone { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #fff; border-radius: 8px; border: 1px solid #f0f0f0; }
    .ms-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .ms-done .ms-dot { background: #10b981; }
    .ms-in_progress .ms-dot { background: #3b82f6; }
    .ms-late .ms-dot { background: #ef4444; }
    .ms-pending .ms-dot { background: #d1d5db; }
    .ms-name { font-size: 13px; font-weight: 600; color: #1a1a2e; flex: 1; }
    .ms-date { font-size: 11px; color: #9ca3af; }
    .ms-status { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: #f3f4f6; color: #6b7280; text-transform: uppercase; }

    /* Observations */
    .observations { background: #fffbeb; border-radius: 10px; padding: 14px; }
    .obs-item { font-size: 13px; color: #78350f; margin: 0 0 6px; line-height: 1.4; }
    .obs-item:last-child { margin-bottom: 0; }

    /* Result section shared */
    .result-section { margin-bottom: 4px; }
    .section-heading { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #374151; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; }
    .count-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px; background: #e5e7eb; color: #4b5563; }
    .count-badge.danger { background: #fee2e2; color: #991b1b; }
    .count-badge.success { background: #d1fae5; color: #065f46; }

    .indicators-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
    .indicator-card { background: #fff; border-radius: 10px; padding: 14px; border: 1px solid #f0f0f0; border-left: 3px solid #e5e7eb; transition: transform 0.15s, box-shadow 0.15s; }
    .indicator-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .state-green { border-left-color: #10b981; } .state-yellow { border-left-color: #f59e0b; }
    .state-orange { border-left-color: #f97316; } .state-red { border-left-color: #ef4444; }
    .ind-top { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
    .ind-state-dot { width: 8px; height: 8px; border-radius: 50%; }
    .state-green .ind-state-dot { background: #10b981; } .state-yellow .ind-state-dot { background: #f59e0b; }
    .state-orange .ind-state-dot { background: #f97316; } .state-red .ind-state-dot { background: #ef4444; }
    .ind-name { font-size: 13px; font-weight: 600; color: #1a1a2e; flex: 1; }
    .ind-trend { font-size: 14px; }
    .ind-values { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
    .ind-current { font-size: 18px; font-weight: 700; color: #374151; }
    .ind-separator { font-size: 12px; color: #d1d5db; }
    .ind-target { font-size: 13px; color: #9ca3af; }
    .ind-category { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }

    .risk-card { background: #fff; border-radius: 10px; padding: 14px; border: 1px solid #f0f0f0; border-left: 3px solid #e5e7eb; margin-bottom: 8px; transition: transform 0.15s; }
    .risk-card:hover { transform: translateX(4px); }
    .sev-critical { border-left-color: #ef4444; } .sev-high { border-left-color: #f59e0b; }
    .sev-medium { border-left-color: #3b82f6; } .sev-low { border-left-color: #10b981; }
    .risk-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .risk-name { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .risk-badges { display: flex; gap: 6px; }
    .sev-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: #f3f4f6; color: #6b7280; }
    .risk-status-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 6px; background: #fef3c7; color: #78350f; }
    .risk-desc { font-size: 12px; color: #6b7280; margin: 0 0 6px; line-height: 1.4; }
    .risk-meta { display: flex; gap: 8px; font-size: 11px; color: #9ca3af; align-items: center; }
    .risk-sep { color: #d1d5db; }
    .risk-cat { margin-left: auto; background: #f3f4f6; padding: 1px 6px; border-radius: 4px; }

    .action-card { background: #fff; border-radius: 10px; padding: 14px; border: 1px solid #f0f0f0; border-left: 3px solid #e5e7eb; margin-bottom: 8px; transition: transform 0.15s; }
    .action-card:hover { transform: translateX(4px); }
    .prio-critical { border-left-color: #ef4444; } .prio-high { border-left-color: #f59e0b; }
    .prio-medium { border-left-color: #3b82f6; } .prio-low { border-left-color: #10b981; }
    .action-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .prio-badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }
    .badge-critical { background: #fee2e2; color: #7f1d1d; } .badge-high { background: #fef3c7; color: #78350f; }
    .badge-medium { background: #dbeafe; color: #1e3a8a; } .badge-low { background: #d1fae5; color: #065f46; }
    .action-name { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .action-desc { font-size: 12px; color: #6b7280; margin: 0 0 6px; line-height: 1.4; }
    .action-bottom { display: flex; gap: 12px; flex-wrap: wrap; }
    .action-impact { font-size: 12px; color: #059669; margin: 0; }
    .action-assignee, .action-deadline { font-size: 11px; color: #9ca3af; }

    /* ─── Form ────────────────────────────────────────── */
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
    .input { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 14px; box-sizing: border-box; font-family: inherit; transition: border-color 0.2s; }
    .input.textarea { resize: none; line-height: 1.6; }
    .input:focus { outline: none; border-color: #FF6B00; }

    .text-input-section { margin-bottom: 20px; }

    .analyze-intro { display: flex; gap: 14px; align-items: flex-start; background: linear-gradient(135deg, #f0f4ff, #fef3e8); border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; }
    .intro-icon { font-size: 28px; flex-shrink: 0; margin-top: 2px; }
    .intro-title { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
    .intro-desc { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.5; }

    .input-section { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .analyze-input { width: 100%; padding: 14px 16px; border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 14px; resize: none; font-family: inherit; line-height: 1.6; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
    .analyze-input:focus { outline: none; border-color: #FF6B00; box-shadow: 0 0 0 3px rgba(255,107,0,0.08); }
    .analyze-input::placeholder { color: #c0c4cc; }

    /* ─── Buttons ─────────────────────────────────────── */
    .btn-analyze { width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #FF6B00, #ff8c33); color: #fff; transition: all 0.25s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-analyze:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(255,107,0,0.3); }
    .btn-analyze:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
    .btn-analyze.large { flex: none; padding: 12px 28px; width: auto; }
    .btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .result-actions { display: flex; gap: 12px; }
    .btn-apply { flex: 1; padding: 12px; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; color: #374151; transition: all 0.2s; }
    .btn-apply:hover { background: #f0fdf4; border-color: #10b981; color: #059669; }
    .btn-secondary { flex: 1; padding: 12px; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; color: #374151; }
    .btn-secondary:hover { background: #f3f4f6; border-color: #d1d5db; }

    /* ─── Recommendations ─────────────────────────────── */
    .urgency-banner { display: flex; align-items: center; gap: 16px; border-radius: 14px; padding: 18px 22px; margin-bottom: 20px; }
    .urgency-normal { background: linear-gradient(135deg, #d1fae5, #ecfdf5); }
    .urgency-elevated { background: linear-gradient(135deg, #fef3c7, #fffbeb); }
    .urgency-critical { background: linear-gradient(135deg, #fee2e2, #fef2f2); }
    .urgency-icon { font-size: 32px; }
    .urgency-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px; color: #374151; }
    .urgency-summary { font-size: 13px; color: #4b5563; margin: 0; line-height: 1.5; }

    .recos-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .reco-card { display: flex; gap: 14px; background: #fff; border: 1px solid #f0f0f0; border-radius: 14px; padding: 18px; border-left: 4px solid #e5e7eb; transition: transform 0.15s, box-shadow 0.15s; }
    .reco-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .reco-prio-critical { border-left-color: #ef4444; } .reco-prio-high { border-left-color: #f59e0b; }
    .reco-prio-medium { border-left-color: #3b82f6; } .reco-prio-low { border-left-color: #10b981; }
    .reco-number { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #6b7280; }
    .reco-content { flex: 1; }
    .reco-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .reco-prio-badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }
    .reco-category { font-size: 11px; color: #6b7280; background: #f3f4f6; padding: 2px 8px; border-radius: 6px; }
    .reco-timeframe { font-size: 11px; color: #9ca3af; margin-left: auto; }
    .reco-title { font-size: 14px; font-weight: 700; margin: 0 0 6px; color: #1a1a2e; }
    .reco-desc { font-size: 13px; color: #6b7280; margin: 0 0 8px; line-height: 1.5; }
    .reco-impact { font-size: 12px; color: #059669; margin: 0; }

    .signals-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .signals-card { border-radius: 12px; padding: 16px; }
    .signals-card h4 { font-size: 13px; font-weight: 700; margin: 0 0 10px; }
    .signals-card p { font-size: 12px; margin: 0 0 4px; color: #374151; line-height: 1.4; }
    .signals-card.danger { background: #fef2f2; }
    .signals-card.success { background: #f0fdf4; }

    .empty-reco { text-align: center; padding: 48px 24px; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty-title { font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; }
    .empty-desc { font-size: 13px; color: #6b7280; margin: 0 0 24px; line-height: 1.5; max-width: 400px; margin-left: auto; margin-right: auto; }

    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; height: 260px; color: #6b7280; }
    .ai-pulse-loader { position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; }
    .pulse-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(255,107,0,0.3); animation: pulse-ring 1.5s ease-out infinite; }
    .pulse-ring.delay { animation-delay: 0.5s; }
    .pulse-icon { font-size: 24px; z-index: 1; }

    @media (max-width: 640px) {
      .indicators-grid { grid-template-columns: 1fr; }
      .signals-row, .meta-cards { grid-template-columns: 1fr; }
      .quick-stats { grid-template-columns: repeat(2, 1fr); }
      .ai-header { padding: 16px 16px 0; }
      .import-area, .analyze-area, .reco-area { padding: 16px; }
    }
  `]
})
export class AiAssistantComponent {
  private readonly aiService = inject(AiService);
  private readonly notification = inject(NotificationService);

  projectId = input<string>('');
  projectName = input<string>('Mon Projet');
  projectContext = input<any>(null);

  tab = signal<AiTab>('import');
  aiOnline = signal(true);

  // Import tab
  isDragOver = signal(false);
  filePreview = signal<FilePreviewResult | null>(null);
  ingesting = signal(false);
  ingestStep = signal('Lecture du fichier...');
  ingestProgress = signal(0);
  ingestionResult = signal<NLExtractionResult | null>(null);
  selectedFile: File | null = null;
  importProjectName = '';
  importText = '';

  // Analyze tab
  analyzeInput = '';
  analyzing = signal(false);
  analysisResult = signal<NLExtractionResult | null>(null);

  // Recommendations tab
  loadingRecos = signal(false);
  recos = signal<AIRecommendationsResult | null>(null);

  // ── Drag & Drop ─────────────────────────────────────
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.selectedFile = file;
    this.aiService.previewFile(file).subscribe({
      next: (preview) => this.filePreview.set(preview),
      error: () => {
        this.notification.error('Impossible de lire le fichier');
        this.selectedFile = null;
      }
    });
  }

  clearFile(): void {
    this.selectedFile = null;
    this.filePreview.set(null);
    this.ingestionResult.set(null);
  }

  // ── File Ingestion ─────────────────────────────────
  runIngestion(): void {
    if (!this.selectedFile) return;
    this.ingesting.set(true);
    this.ingestStep.set('Lecture du fichier...');
    this.ingestProgress.set(15);

    setTimeout(() => { this.ingestStep.set('Extraction du contenu...'); this.ingestProgress.set(35); }, 800);
    setTimeout(() => { this.ingestStep.set('Analyse IA en cours...'); this.ingestProgress.set(60); }, 2000);
    setTimeout(() => { this.ingestStep.set('Structuration des données...'); this.ingestProgress.set(80); }, 5000);

    this.aiService.ingestFile(this.selectedFile, this.importProjectName || undefined).subscribe({
      next: (result) => {
        this.ingestProgress.set(100);
        this.ingestStep.set('Terminé !');
        setTimeout(() => {
          this.ingestionResult.set(result);
          this.ingesting.set(false);
          this.filePreview.set(null);
        }, 500);
      },
      error: () => {
        this.notification.error('Erreur d\'analyse — vérifiez que le moteur IA est démarré');
        this.ingesting.set(false);
        this.aiOnline.set(false);
      }
    });
  }

  // ── Text analysis (import tab alternative) ─────────
  analyzeText(): void {
    if (!this.importText.trim()) return;
    this.ingesting.set(true);
    this.ingestStep.set('Analyse du texte...');
    this.ingestProgress.set(40);

    setTimeout(() => { this.ingestStep.set('Extraction IA...'); this.ingestProgress.set(70); }, 1500);

    this.aiService.extractFromText(this.importProjectName || this.projectName(), this.importText).subscribe({
      next: (result) => {
        this.ingestProgress.set(100);
        setTimeout(() => {
          this.ingestionResult.set(result);
          this.ingesting.set(false);
        }, 400);
      },
      error: () => {
        this.notification.error('Erreur d\'analyse');
        this.ingesting.set(false);
        this.aiOnline.set(false);
      }
    });
  }

  resetImport(): void {
    this.clearFile();
    this.importText = '';
    this.importProjectName = '';
    this.ingestProgress.set(0);
  }

  // ── Analyze tab ─────────────────────────────────────
  runAnalysis(): void {
    const text = this.analyzeInput.trim();
    if (!text) return;
    this.analyzing.set(true);
    this.analysisResult.set(null);
    this.aiService.extractFromText(this.projectName(), text).subscribe({
      next: (result) => { this.analysisResult.set(result); this.analyzing.set(false); },
      error: () => { this.notification.error('Erreur d\'analyse'); this.analyzing.set(false); this.aiOnline.set(false); }
    });
  }

  // ── Recommendations tab ─────────────────────────────
  loadRecos(): void {
    const ctx = this.projectContext();
    if (!ctx) { this.notification.warning('Contexte projet requis'); return; }
    this.loadingRecos.set(true);
    this.aiService.getRecommendations({
      projectName: ctx.name ?? this.projectName(),
      meteoState: ctx.meteo ?? 'NUAGE_CLAIR', score: ctx.score ?? 0,
      budgetConsumedPct: ctx.budgetConsumedPct ?? 0, actualProgress: ctx.progress ?? 0,
      plannedProgress: ctx.plannedProgress ?? 0, qualityScore: ctx.qualityScore ?? 0,
      lateActions: ctx.lateActions ?? 0, criticalRisks: ctx.criticalRisks ?? 0,
      forced: ctx.forced ?? false, forcingRule: ctx.forcingRule,
    }).subscribe({
      next: (r) => { this.recos.set(r); this.loadingRecos.set(false); },
      error: () => { this.notification.error('Erreur'); this.loadingRecos.set(false); this.aiOnline.set(false); }
    });
  }

  applyIngestion(): void {
    this.notification.success('Données importées avec succès — disponibles dans Indicateurs, Risques et Actions');
  }

  // ── Helpers ─────────────────────────────────────────
  healthIcon(h: string): string { return ({ SOLEIL: '☀️', NUAGE_CLAIR: '⛅', NUAGE_CHARGE: '☁️', ORAGE: '⛈️' } as any)[h] ?? '🌤️'; }
  healthLabel(h: string): string {
    return ({ SOLEIL: 'Soleil — Projet en bonne santé', NUAGE_CLAIR: 'Nuage Clair — Situation sous contrôle', NUAGE_CHARGE: 'Nuage Chargé — Tensions détectées', ORAGE: 'Orage — Situation critique' } as any)[h] ?? h;
  }
  trendIcon(t: string): string { return t === 'UP' ? '📈' : t === 'DOWN' ? '📉' : '➡️'; }
  getSevClass(sev: number): string { return sev >= 15 ? 'critical' : sev >= 9 ? 'high' : sev >= 4 ? 'medium' : 'low'; }
  urgencyIcon(u: string): string { return u === 'CRITICAL' ? '🚨' : u === 'ELEVATED' ? '⚠️' : '✅'; }
  urgencyLabel(u: string): string { return ({ CRITICAL: 'Situation Critique', ELEVATED: 'Vigilance Élevée', NORMAL: 'Situation Normale' } as any)[u] ?? u; }
  fileTypeIcon(t: string): string { return ({ csv: '📊', excel: '📗', pdf: '📕', text: '📝' } as any)[t] ?? '📄'; }
  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }
}
