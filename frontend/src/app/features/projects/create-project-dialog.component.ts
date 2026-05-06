import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectService, ProjectCreateRequest } from '../../core/services/project.service';

@Component({
  selector: 'app-create-project-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel-overlay" (click)="onClose()">
      <aside class="slide-panel" (click)="$event.stopPropagation()" aria-label="Create project">
        <header class="panel-header">
          <div>
            <p class="eyebrow">New portfolio item</p>
            <h2>Create project</h2>
            <p class="header-sub">Step {{ step() }} of 3</p>
          </div>
          <button class="close-btn" type="button" (click)="onClose()" aria-label="Close">x</button>
        </header>

        <div class="step-indicators">
          @for (s of steps; track s.num) {
            <div class="step-item" [class.active]="step() === s.num" [class.done]="step() > s.num">
              <div class="step-circle">{{ step() > s.num ? 'OK' : s.num }}</div>
              <span class="step-label">{{ s.label }}</span>
            </div>
            @if (s.num < 3) { <div class="step-line" [class.done]="step() > s.num"></div> }
          }
        </div>

        <main class="step-content">
          @if (step() === 1) {
            <section class="form-section">
              <div class="form-group">
                <label>Project name *</label>
                <input type="text" class="form-input" [(ngModel)]="form.name"
                       (ngModelChange)="autoGenerateCode()"
                       placeholder="Client CRM redesign" />
              </div>
              <div class="form-group">
                <label>Project code *</label>
                <input type="text" class="form-input code-input" [(ngModel)]="form.code"
                       placeholder="CRM-001" maxlength="20" />
              </div>
              <div class="form-group">
                <label>Executive summary</label>
                <textarea class="form-input" [(ngModel)]="form.shortDescription"
                          rows="3" placeholder="One sentence that explains the business outcome."></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Type *</label>
                  <select class="form-input" [(ngModel)]="form.type">
                    <option value="">Select</option>
                    <option value="APPLICATION">Application</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="PROCESS">Process</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Criticality *</label>
                  <select class="form-input" [(ngModel)]="form.criticality">
                    <option value="">Select</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Visibility</label>
                <select class="form-input" [(ngModel)]="form.visibility">
                  <option value="PUBLIC">Public - all members</option>
                  <option value="RESTRICTED">Restricted - project team</option>
                  <option value="PRIVATE">Private - creator only</option>
                </select>
              </div>
            </section>
          }

          @if (step() === 2) {
            <section class="form-section">
              <div class="form-row">
                <div class="form-group">
                  <label>Start date *</label>
                  <input type="date" class="form-input" [(ngModel)]="form.startDate" />
                </div>
                <div class="form-group">
                  <label>End date *</label>
                  <input type="date" class="form-input" [(ngModel)]="form.endDate" />
                </div>
              </div>
              @if (form.startDate && form.endDate && form.endDate <= form.startDate) {
                <div class="inline-error">End date must be after the start date.</div>
              }
              <div class="form-group">
                <label>Total budget</label>
                <div class="input-with-prefix">
                  <span class="input-prefix">MAD</span>
                  <input type="number" class="form-input prefix-input" [(ngModel)]="form.budgetTotal"
                         placeholder="0" min="0" />
                </div>
              </div>
              @if (form.budgetTotal > 0) {
                <div class="budget-preview">
                  <span>Budget baseline</span>
                  <strong>{{ form.budgetTotal | number:'1.0-0' }} MAD</strong>
                </div>
              }
            </section>
          }

          @if (step() === 3) {
            <section class="form-section">
              <div class="form-group">
                <label>Project owner</label>
                <select class="form-input" [(ngModel)]="form.chefId">
                  <option value="">Select later</option>
                  @for (u of users(); track u.id) {
                    <option [value]="u.id">{{ u.firstName }} {{ u.lastName }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Sponsor</label>
                <select class="form-input" [(ngModel)]="form.sponsorId">
                  <option value="">Select later</option>
                  @for (u of users(); track u.id) {
                    <option [value]="u.id">{{ u.firstName }} {{ u.lastName }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Director</label>
                <select class="form-input" [(ngModel)]="form.directorId">
                  <option value="">Select later</option>
                  @for (u of users(); track u.id) {
                    <option [value]="u.id">{{ u.firstName }} {{ u.lastName }}</option>
                  }
                </select>
              </div>

              <div class="recap-card">
                <h3>Launch summary</h3>
                <div class="recap-row"><span>Name</span><strong>{{ form.name || 'Missing' }}</strong></div>
                <div class="recap-row"><span>Code</span><strong>{{ form.code || 'Missing' }}</strong></div>
                <div class="recap-row"><span>Type</span><strong>{{ form.type || 'Missing' }}</strong></div>
                <div class="recap-row"><span>Criticality</span><strong>{{ form.criticality || 'Missing' }}</strong></div>
                <div class="recap-row"><span>Dates</span><strong>{{ form.startDate || 'Start' }} to {{ form.endDate || 'End' }}</strong></div>
                @if (form.budgetTotal) {
                  <div class="recap-row"><span>Budget</span><strong>{{ form.budgetTotal | number:'1.0-0' }} MAD</strong></div>
                }
              </div>
            </section>
          }

          @if (errorMessage()) {
            <div class="error-message">{{ errorMessage() }}</div>
          }
        </main>

        <footer class="panel-footer">
          <button class="btn btn-secondary" (click)="onClose()" type="button">Cancel</button>
          <div class="footer-right">
            @if (step() > 1) {
              <button class="btn btn-secondary" (click)="prevStep()" type="button">Back</button>
            }
            @if (step() < 3) {
              <button class="btn btn-primary" (click)="nextStep()" type="button" [disabled]="!canProceed()">
                Continue
              </button>
            } @else {
              <button class="btn btn-primary" (click)="onSubmit()" type="button" [disabled]="submitting()">
                {{ submitting() ? 'Creating...' : 'Create project' }}
              </button>
            }
          </div>
        </footer>
      </aside>
    </div>
  `,
  styles: [`
    .panel-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
      background: rgba(17, 24, 39, 0.42);
      backdrop-filter: blur(5px);
    }
    .slide-panel {
      width: 560px;
      max-width: 100vw;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #fff;
      border-left: 1px solid var(--border);
      box-shadow: -24px 0 60px rgba(17, 24, 39, 0.18);
      animation: slideIn 0.24s ease-out;
      overflow: hidden;
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.45rem 1.35rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    .eyebrow {
      margin: 0 0 0.3rem;
      font-size: 0.7rem;
      font-weight: 850;
      color: var(--primary);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .panel-header h2 { margin: 0; font-size: 1.35rem; color: var(--text-primary); }
    .header-sub { margin: 0.35rem 0 0; color: var(--text-secondary); font-size: 0.84rem; }
    .close-btn {
      width: 34px;
      height: 34px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: #fff;
      color: var(--text-secondary);
      cursor: pointer;
      font-weight: 900;
    }
    .close-btn:hover { color: var(--danger); border-color: #fecaca; background: #fef2f2; }

    .step-indicators {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 1rem 1.35rem;
      border-bottom: 1px solid var(--border);
      background: #fbfcff;
    }
    .step-item { display: flex; align-items: center; gap: 0.5rem; }
    .step-circle {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: #fff;
      color: var(--text-secondary);
      font-size: 0.68rem;
      font-weight: 900;
    }
    .step-item.active .step-circle { background: #111827; border-color: #111827; color: #fff; }
    .step-item.done .step-circle { background: var(--success); border-color: var(--success); color: #fff; }
    .step-label { font-size: 0.82rem; color: var(--text-secondary); font-weight: 750; }
    .step-item.active .step-label { color: var(--text-primary); }
    .step-line { flex: 1; height: 1px; background: var(--border); margin: 0 0.55rem; min-width: 22px; }
    .step-line.done { background: var(--success); }

    .step-content { flex: 1; overflow-y: auto; padding: 1.25rem 1.35rem; }
    .form-section { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.42rem; }
    .form-group label { color: var(--text-primary); font-size: 0.83rem; font-weight: 850; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
    .form-input { width: 100%; box-sizing: border-box; }
    .code-input { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; text-transform: uppercase; letter-spacing: 0.04em; }
    textarea.form-input { resize: vertical; min-height: 88px; }
    select.form-input { cursor: pointer; }
    .input-with-prefix {
      display: flex;
      align-items: stretch;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: #fff;
      overflow: hidden;
    }
    .input-prefix {
      display: grid;
      place-items: center;
      padding: 0 0.85rem;
      background: var(--bg);
      color: var(--text-secondary);
      font-weight: 850;
      border-right: 1px solid var(--border);
    }
    .prefix-input { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
    .inline-error, .error-message {
      padding: 0.75rem 0.85rem;
      border: 1px solid #fecaca;
      border-radius: 12px;
      background: #fef2f2;
      color: #b91c1c;
      font-size: 0.84rem;
      font-weight: 750;
    }
    .budget-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem;
      border: 1px solid #bbf7d0;
      border-radius: 14px;
      background: #f0fdf4;
      color: #166534;
      font-weight: 800;
    }
    .recap-card {
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: #fbfcff;
    }
    .recap-card h3 { margin: 0 0 0.75rem; font-size: 1rem; color: var(--text-primary); }
    .recap-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.58rem 0;
      border-bottom: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: 0.86rem;
    }
    .recap-row:last-child { border-bottom: 0; }
    .recap-row strong { color: var(--text-primary); text-align: right; }
    .panel-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.35rem;
      border-top: 1px solid var(--border);
      background: #fff;
    }
    .footer-right { display: flex; gap: 0.65rem; }
    @media (max-width: 620px) {
      .slide-panel { width: 100%; }
      .form-row { grid-template-columns: 1fr; }
      .panel-footer { align-items: stretch; flex-direction: column; }
      .footer-right, .panel-footer .btn { width: 100%; }
    }
  `]
})
export class CreateProjectDialogComponent {
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  close = output<boolean>();

  step = signal(1);
  submitting = signal(false);
  errorMessage = signal('');
  users = signal<{ id: string; firstName: string; lastName: string }[]>([]);

  steps = [
    { num: 1, label: 'Basics' },
    { num: 2, label: 'Plan' },
    { num: 3, label: 'Team' },
  ];

  form: ProjectCreateRequest & { chefId?: string; sponsorId?: string; directorId?: string } = {
    name: '',
    code: '',
    shortDescription: '',
    type: '',
    criticality: '',
    visibility: 'PUBLIC',
    startDate: '',
    endDate: '',
    budgetTotal: 0,
    chefId: '',
    sponsorId: '',
    directorId: '',
  };

  canProceed(): boolean {
    if (this.step() === 1) return !!(this.form.name && this.form.code && this.form.type && this.form.criticality);
    if (this.step() === 2) return !!(this.form.startDate && this.form.endDate && this.form.endDate > this.form.startDate);
    return true;
  }

  autoGenerateCode(): void {
    if (!this.form.name) return;
    const words = this.form.name.toUpperCase().split(/\s+/).filter(w => w.length > 2);
    const base = words.slice(0, 2).map(w => w.slice(0, 3)).join('-');
    this.form.code = base ? `${base}-001` : '';
  }

  prevStep(): void { if (this.step() > 1) this.step.update(s => s - 1); }
  nextStep(): void { if (this.canProceed()) this.step.update(s => s + 1); }
  onClose(): void { this.close.emit(false); }

  onSubmit(): void {
    if (!this.canProceed()) return;
    this.submitting.set(true);
    this.errorMessage.set('');

    const payload: ProjectCreateRequest = {
      name: this.form.name,
      code: this.form.code,
      shortDescription: this.form.shortDescription,
      type: this.form.type,
      criticality: this.form.criticality,
      visibility: this.form.visibility,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      budgetTotal: this.form.budgetTotal,
      chefId: this.form.chefId || undefined,
      sponsorId: this.form.sponsorId || undefined,
      directorId: this.form.directorId || undefined,
    };

    this.projectService.createProject(payload).subscribe({
      next: (project) => {
        this.submitting.set(false);
        this.close.emit(true);
        this.router.navigate(['/app/projects', project.id]);
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message ?? 'Could not create project.');
      }
    });
  }
}
