import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div
      style="padding: 50px; max-width: 400px; margin: 50px auto; border: 2px solid #1976d2; border-radius: 8px;"
    >
      <h1 style="color: #1976d2;">🔒 OWASP ASVS Manager</h1>
      <h2 style="color: #666;">Créer un compte</h2>

      <form (ngSubmit)="onSubmit()">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
          <input
            type="email"
            [(ngModel)]="data.email"
            name="email"
            required
            style="padding: 12px; width: 100%; font-size: 16px; border: 2px solid #ddd; border-radius: 4px;"
          />
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;"
            >Mot de passe:</label
          >
          <input
            type="password"
            [(ngModel)]="data.password"
            name="password"
            required
            minlength="6"
            style="padding: 12px; width: 100%; font-size: 16px; border: 2px solid #ddd; border-radius: 4px;"
          />
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Rôle:</label>
          <select
            [(ngModel)]="data.role"
            name="role"
            required
            style="padding: 12px; width: 100%; font-size: 16px; border: 2px solid #ddd; border-radius: 4px;"
          >
            <option value="ADMIN">Admin</option>
            <option value="DEVELOPER">Développeur</option>
            <option value="AUDITOR">Auditeur</option>
          </select>
        </div>

        <div
          *ngIf="errorMessage"
          style="color: #d32f2f; padding: 10px; background: #ffebee; border-radius: 4px; margin-bottom: 15px;"
        >
          ⚠️ {{ errorMessage }}
        </div>

        <button
          type="submit"
          [disabled]="loading"
          style="padding: 15px; width: 100%; font-size: 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          {{ loading ? '⏳ Création...' : '✓ Créer le compte' }}
        </button>
      </form>

      <p style="margin-top: 20px; text-align: center;">
        <a routerLink="/login" style="color: #1976d2;">← Déjà un compte ? Se connecter</a>
      </p>
    </div>
  `,
})
export class RegisterComponent {
  data = { email: '', password: '', role: 'DEVELOPER' };
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.data).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.error?.message || 'Erreur lors de la création';
      },
    });
  }
}
