import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  appHasRole = input.required<string | string[]>();

  private hasView = false;

  constructor() {
    effect(() => {
      const user = this.auth.user();
      const roles = Array.isArray(this.appHasRole()) ? this.appHasRole() as string[] : [this.appHasRole() as string];
      const hasAccess = user && (user.role === 'ADMIN' || roles.includes(user.role));

      if (hasAccess && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasAccess && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
