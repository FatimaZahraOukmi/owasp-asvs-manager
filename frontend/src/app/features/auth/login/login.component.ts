import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>OWASP ASVS Manager</mat-card-title>
          <mat-card-subtitle>Connexion</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                [(ngModel)]="credentials.email"
                name="email"
                required
                email
                #email="ngModel"
              />
              <mat-error *ngIf="email.invalid && email.touched"> Email invalide </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <input
                matInput
                type="password"
                [(ngModel)]="credentials.password"
                name="password"
                required
                minlength="6"
                #password="ngModel"
              />
              <mat-error *ngIf="password.invalid && password.touched">
                Mot de passe requis (min 6 caractères)
              </mat-error>
            </mat-form-field>

            <div class="error-message" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="loading || loginForm.invalid"
              class="full-width"
            >
              <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
              <span *ngIf="!loading">Se connecter</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button routerLink="/register">Créer un compte</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-container {
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .login-card {
        width: 100%;
        max-width: 400px;
        padding: 20px;
      }
      .full-width {
        width: 100%;
        margin-bottom: 15px;
      }
      .error-message {
        color: #f44336;
        margin-bottom: 15px;
        text-align: center;
      }
      mat-card-title {
        font-size: 24px;
        margin-bottom: 8px;
      }
      mat-card-subtitle {
        color: #666;
      }
    `,
  ],
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.loading = false;

        if (response.success) {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';

          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.error?.message || 'Erreur de connexion';
      },
    });
  }
}
