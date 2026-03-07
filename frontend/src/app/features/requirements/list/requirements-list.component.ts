import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequirementService, Requirement } from '../../../core/services/requirement.service';

interface CategoryGroup {
  area: string;
  areaLabel: string;
  items: Requirement[];
  expanded: boolean;
  total: number;
  l1: number;
  l2: number;
  l3: number;
}

@Component({
  selector: 'app-requirements-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <style>
      .page-title {
        font-size: 1.6rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 4px;
      }
      .page-sub {
        color: #64748b;
        font-size: 0.9rem;
        margin-bottom: 24px;
      }

      .filter-card {
        background: #fff;
        border-radius: 12px;
        padding: 16px 18px;
        margin-bottom: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
      .filter-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        margin-bottom: 5px;
      }
      .filter-control {
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 0.875rem;
        color: #334155;
        outline: none;
        width: 100%;
        background: #fff;
        transition: border 0.2s;
        box-sizing: border-box;
      }
      .filter-control:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
      .reset-btn {
        background: #f8fafc;
        color: #64748b;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .reset-btn:hover {
        background: #f1f5f9;
      }
      .filters-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: flex-end;
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
        flex: 1;
        min-width: 160px;
      }
      .filter-group.small {
        flex: 0 0 auto;
      }

      /* View toggle */
      .view-toggle {
        display: flex;
        background: #f1f5f9;
        border-radius: 10px;
        padding: 3px;
        gap: 2px;
      }
      .view-btn-toggle {
        padding: 6px 14px;
        border-radius: 8px;
        border: none;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        color: #64748b;
        background: transparent;
      }
      .view-btn-toggle.active {
        background: #fff;
        color: #3b82f6;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      /* Category cards */
      .cat-card {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        margin-bottom: 10px;
        overflow: hidden;
        transition: box-shadow 0.2s;
      }
      .cat-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .cat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        cursor: pointer;
        transition: background 0.15s;
        user-select: none;
      }
      .cat-header:hover {
        background: #fafbff;
      }
      .cat-name {
        font-size: 0.92rem;
        font-weight: 700;
        color: #0f172a;
      }
      .cat-sub {
        font-size: 0.72rem;
        color: #94a3b8;
        margin-top: 2px;
      }
      .cat-meta {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .cat-badges {
        display: flex;
        gap: 5px;
      }
      .lvl-badge {
        padding: 2px 7px;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 700;
      }
      .lvl-1 {
        background: #d1fae5;
        color: #065f46;
      }
      .lvl-2 {
        background: #fef3c7;
        color: #92400e;
      }
      .lvl-3 {
        background: #fee2e2;
        color: #991b1b;
      }
      .cat-count {
        font-size: 0.75rem;
        font-weight: 700;
        color: #64748b;
        background: #f1f5f9;
        padding: 3px 10px;
        border-radius: 20px;
      }
      .cat-toggle {
        font-size: 0.8rem;
        color: #94a3b8;
        transition: transform 0.25s;
        display: inline-block;
      }
      .cat-toggle.open {
        transform: rotate(180deg);
      }
      .cat-body {
        border-top: 1px solid #f1f5f9;
      }

      /* Cat table (sans colonne domaine) */
      .thead-row-cat {
        display: grid;
        grid-template-columns: 100px 50px 1fr 90px 50px;
        gap: 12px;
        padding: 10px 18px;
        background: #f8fafc;
        color: #94a3b8;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        align-items: center;
      }
      .req-row-cat {
        display: grid;
        grid-template-columns: 100px 50px 1fr 90px 50px;
        gap: 12px;
        padding: 11px 18px;
        border-bottom: 1px solid #f8fafc;
        align-items: center;
        transition: background 0.15s;
      }
      .req-row-cat:last-child {
        border-bottom: none;
      }
      .req-row-cat:hover {
        background: #fafbff;
      }

      /* List table */
      .table-card {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        overflow: hidden;
      }
      .thead-row {
        display: grid;
        grid-template-columns: 100px 50px 200px 1fr 90px 50px;
        gap: 12px;
        padding: 11px 18px;
        background: #0f172a;
        color: #94a3b8;
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        align-items: center;
      }
      .req-row {
        display: grid;
        grid-template-columns: 100px 50px 200px 1fr 90px 50px;
        gap: 12px;
        padding: 12px 18px;
        border-bottom: 1px solid #f8fafc;
        align-items: center;
        transition: background 0.15s;
      }
      .req-row:last-child {
        border-bottom: none;
      }
      .req-row:hover {
        background: #fafbff;
      }

      .id-badge {
        background: #1e293b;
        color: #e2e8f0;
        font-family: monospace;
        font-size: 0.72rem;
        padding: 3px 8px;
        border-radius: 6px;
        font-weight: 600;
        white-space: nowrap;
      }
      .cwe-badge {
        font-size: 0.75rem;
        color: #6366f1;
        font-weight: 600;
      }
      .area-text {
        font-size: 0.78rem;
        color: #64748b;
        font-weight: 500;
      }
      .desc-text {
        font-size: 0.8rem;
        color: #334155;
        line-height: 1.4;
      }
      .view-btn {
        width: 32px;
        height: 32px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        background: #fff;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        transition: all 0.2s;
        text-decoration: none;
        color: #334155;
      }
      .view-btn:hover {
        border-color: #3b82f6;
        background: #eff6ff;
        color: #3b82f6;
      }

      .spinner-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        gap: 12px;
        color: #64748b;
      }
      .spinner {
        width: 28px;
        height: 28px;
        border: 3px solid #e2e8f0;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .error-box {
        background: #fef2f2;
        border: 1px solid #fca5a5;
        color: #991b1b;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
      }
      .empty-state {
        text-align: center;
        padding: 50px 20px;
      }

      /* Expand all btn */
      .expand-btn {
        background: #f8fafc;
        color: #334155;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        padding: 5px 12px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .expand-btn:hover {
        background: #f1f5f9;
      }
    </style>

    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-1">
      <div>
        <div class="page-title">OWASP ASVS Requirements 🛡️</div>
        <div class="page-sub">{{ filteredRequirements.length }} requirement(s) affichés</div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button *ngIf="viewMode === 'categories'" class="expand-btn" (click)="expandAll()">
          {{ allExpanded ? '▲ Tout fermer' : '▼ Tout ouvrir' }}
        </button>
        <div class="view-toggle">
          <button
            class="view-btn-toggle"
            [class.active]="viewMode === 'categories'"
            (click)="setView('categories')"
          >
            📂 Catégories
          </button>
          <button
            class="view-btn-toggle"
            [class.active]="viewMode === 'list'"
            (click)="setView('list')"
          >
            📋 Liste
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-card">
      <div class="filters-row">
        <div class="filter-group">
          <div class="filter-label">Recherche</div>
          <input
            type="text"
            class="filter-control"
            placeholder="ID ou description..."
            [(ngModel)]="searchText"
            (ngModelChange)="applyFilters()"
          />
        </div>
        <div class="filter-group">
          <div class="filter-label">Niveau ASVS</div>
          <select
            class="filter-control"
            [(ngModel)]="selectedLevel"
            (ngModelChange)="applyFilters()"
          >
            <option [ngValue]="null">Tous les niveaux</option>
            <option [ngValue]="1">L1 — Basique</option>
            <option [ngValue]="2">L2 — Standard</option>
            <option [ngValue]="3">L3 — Avancé</option>
          </select>
        </div>
        <div class="filter-group">
          <div class="filter-label">Domaine</div>
          <select
            class="filter-control"
            [(ngModel)]="selectedArea"
            (ngModelChange)="applyFilters()"
          >
            <option value="">Tous les domaines</option>
            <option *ngFor="let area of areas" [value]="area">{{ translateArea(area) }}</option>
          </select>
        </div>
        <div class="filter-group small">
          <div class="filter-label">&nbsp;</div>
          <button class="reset-btn" (click)="resetFilters()">✕ Reset</button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="spinner-wrap">
      <div class="spinner"></div>
      <span>Chargement...</span>
    </div>
    <div *ngIf="error && !loading" class="error-box">{{ error }}</div>

    <!-- VUE CATÉGORIES -->
    <ng-container *ngIf="!loading && !error && viewMode === 'categories'">
      <div *ngFor="let cat of categories" class="cat-card">
        <div class="cat-header" (click)="toggleCat(cat)">
          <div>
            <div class="cat-name">{{ cat.areaLabel }}</div>
            <div class="cat-sub">{{ cat.total }} requirement{{ cat.total > 1 ? 's' : '' }}</div>
          </div>
          <div class="cat-meta">
            <div class="cat-badges">
              <span *ngIf="cat.l1 > 0" class="lvl-badge lvl-1">L1: {{ cat.l1 }}</span>
              <span *ngIf="cat.l2 > 0" class="lvl-badge lvl-2">L2: {{ cat.l2 }}</span>
              <span *ngIf="cat.l3 > 0" class="lvl-badge lvl-3">L3: {{ cat.l3 }}</span>
            </div>
            <span class="cat-count">{{ cat.total }}</span>
            <span class="cat-toggle" [class.open]="cat.expanded">▼</span>
          </div>
        </div>

        <div class="cat-body" *ngIf="cat.expanded">
          <div class="thead-row-cat">
            <span>ID</span><span>Niv.</span><span>Description</span><span>CWE</span><span></span>
          </div>
          <div *ngFor="let req of cat.items" class="req-row-cat">
            <div>
              <span class="id-badge">{{ req.owaspId }}</span>
            </div>
            <div>
              <span
                class="lvl-badge"
                [ngClass]="req.asvsLevel === 1 ? 'lvl-1' : req.asvsLevel === 2 ? 'lvl-2' : 'lvl-3'"
                >L{{ req.asvsLevel }}</span
              >
            </div>
            <div class="desc-text">{{ req.description }}</div>
            <div>
              <span *ngIf="req.cwe" class="cwe-badge">CWE-{{ req.cwe }}</span>
              <span *ngIf="!req.cwe" style="color:#cbd5e1">—</span>
            </div>
            <div>
              <a [routerLink]="['/requirements', req.id]" class="view-btn" title="Voir détail"
                >👁️</a
              >
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="categories.length === 0" class="empty-state">
        <div style="font-size:2.5rem;margin-bottom:10px">🔍</div>
        <p style="color:#64748b">Aucun requirement trouvé</p>
        <button class="reset-btn" style="padding:8px 20px" (click)="resetFilters()">
          Réinitialiser les filtres
        </button>
      </div>
    </ng-container>

    <!-- VUE LISTE -->
    <ng-container *ngIf="!loading && !error && viewMode === 'list'">
      <div class="table-card">
        <div class="thead-row">
          <span>ID OWASP</span><span>Niv.</span><span>Domaine</span><span>Description</span
          ><span>CWE</span><span></span>
        </div>
        <div *ngFor="let req of filteredRequirements" class="req-row">
          <div>
            <span class="id-badge">{{ req.owaspId }}</span>
          </div>
          <div>
            <span
              class="lvl-badge"
              [ngClass]="req.asvsLevel === 1 ? 'lvl-1' : req.asvsLevel === 2 ? 'lvl-2' : 'lvl-3'"
              >L{{ req.asvsLevel }}</span
            >
          </div>
          <div class="area-text">{{ translateArea(req.area) }}</div>
          <div class="desc-text">{{ req.description }}</div>
          <div>
            <span *ngIf="req.cwe" class="cwe-badge">CWE-{{ req.cwe }}</span>
            <span *ngIf="!req.cwe" style="color:#cbd5e1">—</span>
          </div>
          <div>
            <a [routerLink]="['/requirements', req.id]" class="view-btn" title="Voir détail">👁️</a>
          </div>
        </div>
        <div *ngIf="filteredRequirements.length === 0" class="empty-state">
          <div style="font-size:2.5rem;margin-bottom:10px">🔍</div>
          <p style="color:#64748b">Aucun requirement trouvé</p>
          <button class="reset-btn" style="padding:8px 20px" (click)="resetFilters()">
            Réinitialiser les filtres
          </button>
        </div>
      </div>
    </ng-container>
  `,
})
export class RequirementsListComponent implements OnInit {
  requirements: Requirement[] = [];
  filteredRequirements: Requirement[] = [];
  categories: CategoryGroup[] = [];
  areas: string[] = [];
  viewMode: 'list' | 'categories' = 'categories';
  allExpanded = false;

  loading = true;
  error = '';
  selectedLevel: number | null = null;
  selectedArea: string = '';
  searchText: string = '';

  areaTranslations: { [key: string]: string } = {
    'Architecture, Design and Threat Modeling': '🏗️ Architecture & Modélisation',
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
    Configuration: '🔧 Configuration',
    'Secure Software Development Lifecycle': '♻️ Cycle de vie sécurisé (SDLC)',
  };

  constructor(
    private requirementService: RequirementService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadRequirements();
  }

  loadRequirements(): void {
    this.loading = true;
    this.requirementService.getAll().subscribe({
      next: (data) => {
        this.requirements = data;
        this.filteredRequirements = data;
        this.areas = [...new Set(data.map((r) => r.area))];
        this.buildCategories();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Erreur lors du chargement des requirements';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  buildCategories(): void {
    const map = new Map<string, Requirement[]>();
    for (const req of this.filteredRequirements) {
      if (!map.has(req.area)) map.set(req.area, []);
      map.get(req.area)!.push(req);
    }
    // Preserve expanded state
    const existing = new Map(this.categories.map((c) => [c.area, c.expanded]));
    this.categories = Array.from(map.entries()).map(([area, items]) => ({
      area,
      areaLabel: this.translateArea(area),
      items,
      expanded: existing.get(area) ?? this.allExpanded,
      total: items.length,
      l1: items.filter((r) => r.asvsLevel === 1).length,
      l2: items.filter((r) => r.asvsLevel === 2).length,
      l3: items.filter((r) => r.asvsLevel === 3).length,
    }));
  }

  translateArea(area: string): string {
    return this.areaTranslations[area] || area;
  }

  setView(mode: 'list' | 'categories'): void {
    this.viewMode = mode;
    if (mode === 'categories') this.buildCategories();
    this.cdr.detectChanges();
  }

  toggleCat(cat: CategoryGroup): void {
    cat.expanded = !cat.expanded;
    this.cdr.detectChanges();
  }

  expandAll(): void {
    this.allExpanded = !this.allExpanded;
    this.categories.forEach((c) => (c.expanded = this.allExpanded));
    this.cdr.detectChanges();
  }

  applyFilters(): void {
    this.filteredRequirements = this.requirements.filter((r) => {
      const matchLevel = this.selectedLevel ? r.asvsLevel <= this.selectedLevel : true;
      const matchArea = this.selectedArea ? r.area === this.selectedArea : true;
      const matchSearch = this.searchText
        ? r.description.toLowerCase().includes(this.searchText.toLowerCase()) ||
          r.owaspId.toLowerCase().includes(this.searchText.toLowerCase())
        : true;
      return matchLevel && matchArea && matchSearch;
    });
    this.buildCategories();
    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.selectedLevel = null;
    this.selectedArea = '';
    this.searchText = '';
    this.filteredRequirements = this.requirements;
    this.buildCategories();
    this.cdr.detectChanges();
  }
}
