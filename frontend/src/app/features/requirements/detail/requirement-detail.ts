import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RequirementService, Requirement } from '../../../core/services/requirement.service';
import { environment } from '../../../../environments/environment';

type Language = 'java' | 'python' | 'nodejs';
type Verdict = 'pass' | 'fail' | 'na';

@Component({
  selector: 'app-requirement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './requirement-detail.html',
})
export class RequirementDetailComponent implements OnInit {
  requirement: Requirement | null = null;
  loading = true;
  error = '';

  selectedLanguage: Language = 'python';
  generating = false;
  generatedCode: string | null = null;
  generatedExplanation = '';
  generateError = '';
  copied = false;

  selectedVerdict: Verdict | null = null;
  savedVerdict: Verdict | null = null;
  evalNotes = '';
  saving = false;
  saveMsg = '';
  saveMsgType: 'success' | 'error' = 'success';

  readonly languages = [
    {
      key: 'python' as Language,
      label: 'Python',
      icon: '🐍',
      color: '#60a5fa',
      bg: 'rgba(59,130,246,.15)',
    },
    {
      key: 'java' as Language,
      label: 'Java',
      icon: '☕',
      color: '#f87171',
      bg: 'rgba(239,68,68,.15)',
    },
    {
      key: 'nodejs' as Language,
      label: 'TypeScript',
      icon: '🟦',
      color: '#34d399',
      bg: 'rgba(16,185,129,.15)',
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private requirementService: RequirementService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.requirementService.getById(id).subscribe({
        next: (data) => {
          this.requirement = data;
          this.loading = false;
          this.loadSavedEvaluation();
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Requirement introuvable';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  loadSavedEvaluation(): void {
    if (!this.requirement) return;
    const saved = localStorage.getItem(`eval_${this.requirement.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      this.savedVerdict = parsed.verdict;
      this.selectedVerdict = parsed.verdict;
      this.evalNotes = parsed.notes || '';
    }
  }

  selectVerdict(v: Verdict): void {
    this.selectedVerdict = v;
    this.saveMsg = '';
    this.cdr.detectChanges();
  }

  saveEvaluation(): void {
    if (!this.selectedVerdict || !this.requirement) return;
    this.saving = true;
    this.cdr.detectChanges();

    localStorage.setItem(
      `eval_${this.requirement.id}`,
      JSON.stringify({
        verdict: this.selectedVerdict,
        notes: this.evalNotes,
        savedAt: new Date().toISOString(),
      }),
    );
    this.savedVerdict = this.selectedVerdict;

    setTimeout(() => {
      this.saving = false;
      this.saveMsg = '✅ Enregistré';
      this.saveMsgType = 'success';
      this.cdr.detectChanges();
      setTimeout(() => {
        this.saveMsg = '';
        this.cdr.detectChanges();
      }, 3000);
    }, 500);
  }

  getVerdictLabel(v: Verdict | null): string {
    return v === 'pass'
      ? 'Conforme'
      : v === 'fail'
        ? 'Non conforme'
        : v === 'na'
          ? 'Non applicable'
          : '';
  }

  getVerdictEmoji(v: Verdict | null): string {
    return v === 'pass' ? '✅' : v === 'fail' ? '❌' : v === 'na' ? '➖' : '';
  }

  selectLanguage(lang: Language): void {
    this.selectedLanguage = lang;
    this.generatedCode = null;
    this.generatedExplanation = '';
    this.generateError = '';
    this.cdr.detectChanges();
  }

  get currentLang() {
    return this.languages.find((l) => l.key === this.selectedLanguage)!;
  }

  generateCode(): void {
    if (!this.requirement) return;
    this.generating = true;
    this.generatedCode = null;
    this.generatedExplanation = '';
    this.generateError = '';
    this.cdr.detectChanges();

    this.http
      .post<any>(`${environment.apiUrl}/requirements/${this.requirement.id}/generate-code`, {
        language: this.selectedLanguage,
      })
      .subscribe({
        next: (res) => {
          const data = res.data;
          this.generatedCode = data[this.selectedLanguage] || '// Code non disponible';
          this.generatedExplanation = data.explanation || '';
          this.generating = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.generateError = err?.error?.message || 'Erreur lors de la génération';
          this.generating = false;
          this.cdr.detectChanges();
        },
      });
  }

  copyCode(): void {
    if (!this.generatedCode) return;
    navigator.clipboard.writeText(this.generatedCode);
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
      this.cdr.detectChanges();
    }, 2000);
    this.cdr.detectChanges();
  }

  getLevelBadgeClass(level: number): string {
    return level === 1 ? 'lvl-1' : level === 2 ? 'lvl-2' : 'lvl-3';
  }

  getLevelLabel(level: number): string {
    return level === 1 ? 'L1 — Basique' : level === 2 ? 'L2 — Standard' : 'L3 — Avancé';
  }
}
