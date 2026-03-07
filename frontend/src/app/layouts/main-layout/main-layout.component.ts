import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <span class="logo-icon">🔒</span>
          <span class="logo-text">OWASP<br /><small>ASVS Manager</small></span>
        </div>
        <div class="sidebar-user">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-info">
            <div class="user-email">{{ user?.email }}</div>
            <span class="role-badge role-{{ user?.role?.toLowerCase() }}">{{ user?.role }}</span>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a class="nav-item" routerLink="/dashboard" [class.active]="isActive('/dashboard')">
            <span class="nav-icon">📊</span><span>Dashboard</span>
          </a>
          <a class="nav-item" routerLink="/projects" [class.active]="isActive('/projects')">
            <span class="nav-icon">📁</span><span>Projets</span>
          </a>
          <a class="nav-item" routerLink="/requirements" [class.active]="isActive('/requirements')">
            <span class="nav-icon">🛡️</span><span>Requirements</span>
          </a>
          <a class="nav-item" routerLink="/chat" [class.active]="isActive('/chat')">
            <span class="nav-icon">🤖</span>
            <span>Assistant IA</span>
            <span class="nav-badge">IA</span>
          </a>
          <a
            *ngIf="isAdmin"
            class="nav-item"
            routerLink="/users"
            [class.active]="isActive('/users')"
          >
            <span class="nav-icon">👥</span><span>Utilisateurs</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <span>🚪</span><span>Déconnexion</span>
          </button>
        </div>
      </aside>
      <main class="main-content">
        <router-outlet />
      </main>
    </div>

    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      .app-shell {
        display: flex;
        min-height: 100vh;
        background: #f0f2f5;
        font-family: 'Segoe UI', system-ui, sans-serif;
      }
      .sidebar {
        width: 240px;
        min-height: 100vh;
        background: #0f172a;
        display: flex;
        flex-direction: column;
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 100;
      }
      .sidebar-logo {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .logo-icon {
        font-size: 1.8rem;
      }
      .logo-text {
        color: #fff;
        font-size: 0.85rem;
        font-weight: 700;
        line-height: 1.3;
      }
      .logo-text small {
        color: #64748b;
        font-weight: 400;
        font-size: 0.75rem;
      }
      .sidebar-user {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.9rem;
        flex-shrink: 0;
      }
      .user-info {
        min-width: 0;
      }
      .user-email {
        color: #cbd5e1;
        font-size: 0.72rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 140px;
      }
      .role-badge {
        font-size: 0.65rem;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 20px;
        display: inline-block;
        margin-top: 2px;
      }
      .role-admin {
        background: #fef3c7;
        color: #92400e;
      }
      .role-developer {
        background: #dbeafe;
        color: #1e40af;
      }
      .role-auditor {
        background: #d1fae5;
        color: #065f46;
      }
      .sidebar-nav {
        flex: 1;
        padding: 16px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 10px;
        color: #94a3b8;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
      }
      .nav-item:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #e2e8f0;
      }
      .nav-item.active {
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        color: #fff;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
      }
      .nav-icon {
        font-size: 1.1rem;
        width: 24px;
        text-align: center;
      }
      .nav-badge {
        margin-left: auto;
        background: rgba(99, 102, 241, 0.3);
        color: #a78bfa;
        font-size: 0.6rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 10px;
        border: 1px solid rgba(99, 102, 241, 0.4);
      }
      .nav-item.active .nav-badge {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.3);
      }
      .sidebar-footer {
        padding: 16px 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      .logout-btn {
        width: 100%;
        padding: 10px 12px;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: #94a3b8;
        font-size: 0.875rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
      }
      .logout-btn:hover {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.3);
        color: #f87171;
      }
      .main-content {
        margin-left: 240px;
        flex: 1;
        padding: 28px;
        min-height: 100vh;
      }
    </style>
  `,
})
export class MainLayoutComponent implements OnInit {
  user: any = null;
  userInitial = '';
  isAdmin = false;
  currentUrl = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.isAdmin = this.user?.role === 'ADMIN';
    this.userInitial = (this.user?.firstName?.[0] || this.user?.email?.[0] || 'U').toUpperCase();
    this.currentUrl = this.router.url;
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.currentUrl = e.url;
    });
  }

  isActive(path: string): boolean {
    if (path === '/projects') return this.currentUrl.startsWith('/projects');
    return this.currentUrl === path || this.currentUrl.startsWith(path + '/');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
