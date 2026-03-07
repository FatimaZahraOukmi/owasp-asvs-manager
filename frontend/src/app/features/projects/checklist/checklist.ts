import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  ChecklistService,
  ChecklistItem,
  ChecklistStats,
} from '../../../core/services/checklist.service';
import { AuthService } from '../../../core/services/auth.service';

interface CategoryGroup {
  name: string;
  nameShort: string;
  items: ChecklistItem[];
  expanded: boolean;
  done: number;
  inProgress: number;
  notDone: number;
  total: number;
}

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './checklist.html',
})
export class ChecklistComponent implements OnInit {
  projectId = '';
  projectName = '';
  checklist: ChecklistItem[] = [];
  filteredChecklist: ChecklistItem[] = [];
  stats: ChecklistStats | null = null;
  areas: string[] = [];

  viewMode: 'list' | 'categories' = 'categories';
  categories: CategoryGroup[] = [];

  loading = true;
  error = '';
  saving: string | null = null;

  selectedLevel: number | null = null;
  selectedArea: string = '';
  selectedStatus: string = '';

  isAuditor = false;
  isAdmin = false;

  selectedItem: ChecklistItem | null = null;
  editComment = '';
  editSourceRef = '';
  editToolUsed = '';

  areaTranslations: { [key: string]: string } = {
    'Architecture, Design and Threat Modeling': '🏗️ Architecture & Modélisation des menaces',
    Authentication: '🔐 Authentification',
    'Session Management': '🎫 Gestion des sessions',
    'Access Control': "🚦 Contrôle d'accès",
    'Validation, Sanitization and Encoding': '🧹 Validation & Encodage',
    'Stored Cryptography': '🔒 Cryptographie',
    'Error Handling and Logging': '📋 Erreurs & Journalisation',
    'Data Protection': '🛡️ Protection des données',
    Communications: '📡 Communications sécurisées',
    'Malicious Code': '🦠 Code malveillant',
    'Business Logic': '⚙️ Logique métier',
    'Files and Resources': '📁 Fichiers & Ressources',
    'API and Web Service': '🌐 API & Services Web',
    Configuration: '⚙️ Configuration',
    'Secure Software Development Lifecycle': '♻️ Cycle de vie sécurisé (SDLC)',
  };

  constructor(
    private route: ActivatedRoute,
    private checklistService: ChecklistService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    const user = this.authService.getCurrentUser();
    this.isAuditor = user?.role === 'AUDITOR';
    this.isAdmin = user?.role === 'ADMIN';
    this.loadChecklist();
  }

  loadChecklist(): void {
    this.loading = true;
    this.checklistService.getChecklist(this.projectId).subscribe({
      next: (data) => {
        this.projectName = data.project.name;
        this.checklist = data.checklist;
        this.stats = data.stats;
        this.areas = [...new Set(data.checklist.map((r) => r.area))];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Erreur lors du chargement de la checklist';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  buildCategories(): void {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of this.filteredChecklist) {
      if (!map.has(item.area)) map.set(item.area, []);
      map.get(item.area)!.push(item);
    }
    const existing = new Map(this.categories.map((c) => [c.nameShort, c.expanded]));
    this.categories = Array.from(map.entries()).map(([area, items]) => ({
      name: this.translateArea(area),
      nameShort: area,
      items,
      expanded: existing.get(area) ?? false,
      done: items.filter((i) => i.status === 'DONE').length,
      inProgress: items.filter((i) => i.status === 'IN_PROGRESS').length,
      notDone: items.filter((i) => i.status === 'NOT_DONE').length,
      total: items.length,
    }));
  }

  translateArea(area: string): string {
    return this.areaTranslations[area] || area;
  }

  toggleCategory(cat: CategoryGroup): void {
    cat.expanded = !cat.expanded;
    this.cdr.detectChanges();
  }

  getCategoryScore(cat: CategoryGroup): number {
    if (cat.total === 0) return 0;
    return Math.round((cat.done / cat.total) * 100);
  }

  getCategoryColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  initChecklist(): void {
    this.checklistService.initChecklist(this.projectId).subscribe({
      next: () => this.loadChecklist(),
      error: () => alert("Erreur lors de l'initialisation"),
    });
  }

  applyFilters(): void {
    this.filteredChecklist = this.checklist.filter((r) => {
      const matchLevel = this.selectedLevel ? r.asvsLevel <= this.selectedLevel : true;
      const matchArea = this.selectedArea ? r.area === this.selectedArea : true;
      const matchStatus = this.selectedStatus ? (r.status || 'null') === this.selectedStatus : true;
      return matchLevel && matchArea && matchStatus;
    });
    this.buildCategories();
    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.selectedLevel = null;
    this.selectedArea = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  onStatusChange(item: ChecklistItem, status: string): void {
    if (this.isAuditor) return;
    this.saving = item.requirementId;
    this.checklistService.updateStatus(this.projectId, item.requirementId, { status }).subscribe({
      next: () => {
        item.status = status as any;
        this.recalcStats();
        this.buildCategories();
        this.saving = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = null;
        this.cdr.detectChanges();
      },
    });
  }

  openDetail(item: ChecklistItem): void {
    this.selectedItem = { ...item };
    this.editComment = item.comment || '';
    this.editSourceRef = item.sourceCodeReference || '';
    this.editToolUsed = item.toolUsed || '';
  }

  saveDetail(): void {
    if (!this.selectedItem) return;
    const payload: any = { comment: this.editComment };
    if (!this.isAuditor) {
      payload.sourceCodeReference = this.editSourceRef;
      payload.toolUsed = this.editToolUsed;
    }
    this.checklistService
      .updateStatus(this.projectId, this.selectedItem.requirementId, payload)
      .subscribe({
        next: () => {
          const item = this.checklist.find(
            (r) => r.requirementId === this.selectedItem!.requirementId,
          );
          if (item) {
            item.comment = this.editComment;
            if (!this.isAuditor) {
              item.sourceCodeReference = this.editSourceRef;
              item.toolUsed = this.editToolUsed;
            }
          }
          this.selectedItem = null;
          this.cdr.detectChanges();
        },
      });
  }

  recalcStats(): void {
    if (!this.stats) return;
    this.stats.done = this.checklist.filter((r) => r.status === 'DONE').length;
    this.stats.inProgress = this.checklist.filter((r) => r.status === 'IN_PROGRESS').length;
    this.stats.notDone = this.checklist.filter((r) => r.status === 'NOT_DONE').length;
    this.stats.notApplicable = this.checklist.filter((r) => r.status === 'NOT_APPLICABLE').length;
    const applicable = this.stats.total - this.stats.notApplicable;
    this.stats.score = applicable > 0 ? Math.round((this.stats.done / applicable) * 100) : 0;
  }

  getStatusLabel(status: string | null): string {
    switch (status) {
      case 'DONE':
        return '✅ Fait';
      case 'IN_PROGRESS':
        return '🔄 En cours';
      case 'NOT_DONE':
        return '❌ Non fait';
      case 'NOT_APPLICABLE':
        return '➖ N/A';
      default:
        return '⬜ Non évalué';
    }
  }

  get scoreColor(): string {
    if (!this.stats) return 'bg-secondary';
    if (this.stats.score >= 80) return 'bg-success';
    if (this.stats.score >= 50) return 'bg-warning';
    return 'bg-danger';
  }

  exportJson(): void {
    const missing = this.checklist.filter(
      (r) => r.status === 'NOT_DONE' || r.status === 'IN_PROGRESS' || r.status === null,
    );
    const data = {
      projet: this.projectName,
      dateExport: new Date().toISOString().split('T')[0],
      score: this.stats?.score || 0,
      total: this.stats?.total || 0,
      manquants: missing.length,
      requirementsManquants: missing.map((r) => ({
        owaspId: r.owaspId,
        domaine: this.translateArea(r.area),
        niveau: r.asvsLevel,
        description: r.description,
        cwe: r.cwe || null,
        statut: r.status || 'NON_COMMENCE',
        commentaire: r.comment || null,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asvs-${this.projectName}-${data.dateExport}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
