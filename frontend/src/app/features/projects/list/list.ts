import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProjectService, Project } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list.html',
})
export class ListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private router = inject(Router);

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  loading = true;
  error = '';
  searchText = '';
  isAdmin = false;

  // Import GitHub
  showImportModal = false;
  githubUrl = '';
  importing = false;
  importStep = '';
  importError = '';
  importSuccess = false;
  importedProjectId = '';

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role === 'ADMIN';
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.getAll().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.filteredProjects = projects;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erreur chargement projets';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  applyFilter(): void {
    this.filteredProjects = this.projects.filter(
      (p) =>
        p.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(this.searchText.toLowerCase()),
    );
  }

  getBgColor(name: string): string {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  }

  openImportModal(): void {
    this.showImportModal = true;
    this.githubUrl = '';
    this.importError = '';
    this.importSuccess = false;
    this.importStep = '';
    this.importedProjectId = '';
    this.cdr.detectChanges();
  }

  closeImportModal(): void {
    if (this.importing) return;
    this.showImportModal = false;
    this.cdr.detectChanges();
  }

  extractRepoName(url: string): string {
    try {
      const parts = url.replace(/\.git$/, '').split('/');
      return parts[parts.length - 1] || 'Projet GitHub';
    } catch {
      return 'Projet GitHub';
    }
  }

  async importFromGithub(): Promise<void> {
    if (!this.githubUrl.trim()) return;
    this.importing = true;
    this.importError = '';
    this.importSuccess = false;

    try {
      // Étape 1 — Créer le projet
      this.importStep = '📁 Création du projet...';
      this.cdr.detectChanges();

      const repoName = this.extractRepoName(this.githubUrl);
      const createRes: any = await this.http
        .post(`${environment.apiUrl}/projects`, {
          name: repoName,
          description: `Importé depuis GitHub : ${this.githubUrl}`,
        })
        .toPromise();

      const projectId = createRes.data.id;
      this.importedProjectId = projectId;

      // Étape 2 — Initialiser la checklist
      this.importStep = '🛡️ Initialisation des 286 requirements OWASP...';
      this.cdr.detectChanges();

      await this.http
        .post(`${environment.apiUrl}/projects/${projectId}/checklist/init`, {})
        .toPromise();

      // Étape 3 — Lancer l'analyse IA
      this.importStep = '🤖 Analyse IA du code (2-3 min)...';
      this.cdr.detectChanges();

      // Steps visuels pendant l'analyse
      const steps = [
        { delay: 3000, text: '📥 Clonage du repository GitHub...' },
        { delay: 8000, text: '📂 Lecture des fichiers de code...' },
        { delay: 15000, text: '🔍 Analyse des requirements OWASP ASVS...' },
        { delay: 40000, text: '💾 Sauvegarde des résultats...' },
      ];
      steps.forEach((s) =>
        setTimeout(() => {
          if (this.importing) {
            this.importStep = s.text;
            this.cdr.detectChanges();
          }
        }, s.delay),
      );

      await this.http
        .post(`${environment.apiUrl}/projects/${projectId}/analyze-github`, {
          githubUrl: this.githubUrl,
        })
        .toPromise();

      // Succès !
      this.importStep = '✅ Import terminé !';
      this.importSuccess = true;
      this.importing = false;
      this.loadProjects();
      this.cdr.detectChanges();
    } catch (err: any) {
      this.importing = false;
      this.importError = err?.error?.message || "Erreur lors de l'import";
      this.importStep = '';
      this.cdr.detectChanges();
    }
  }

  goToProject(): void {
    this.showImportModal = false;
    this.router.navigate(['/projects', this.importedProjectId, 'checklist']);
  }
}
