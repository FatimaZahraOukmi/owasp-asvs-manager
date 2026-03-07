import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProjectService, Project } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './detail.html',
})
export class DetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  project: Project | null = null;
  loading = true;
  error: string | null = null;
  isAdmin = false;

  // PDF
  generatingPdf = false;

  // GitHub Analysis
  githubUrl = '';
  analyzing = false;
  analyzeStep = '';
  analyzeResult: any = null;
  analyzeError = '';

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role === 'ADMIN';

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID manquant';
      this.loading = false;
      return;
    }

    this.projectService.getById(id).subscribe({
      next: (p) => {
        this.project = p;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Projet introuvable';
        this.cdr.detectChanges();
      },
    });
  }

  analyzeGithub(): void {
    if (!this.githubUrl || !this.project) return;

    this.analyzing = true;
    this.analyzeResult = null;
    this.analyzeError = '';
    this.analyzeStep = '📥 Clonage du repository...';
    this.cdr.detectChanges();

    // Simuler les étapes visuelles
    const steps = [
      { delay: 2000, text: '📂 Lecture des fichiers de code...' },
      { delay: 8000, text: '🤖 Envoi à Gemini AI...' },
      { delay: 15000, text: '🔍 Analyse des requirements OWASP ASVS...' },
      { delay: 40000, text: '💾 Sauvegarde des résultats...' },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        if (this.analyzing) {
          this.analyzeStep = step.text;
          this.cdr.detectChanges();
        }
      }, step.delay);
    });

    this.http
      .post<any>(`${environment.apiUrl}/projects/${this.project.id}/analyze-github`, {
        githubUrl: this.githubUrl,
      })
      .subscribe({
        next: (res) => {
          this.analyzing = false;
          this.analyzeResult = res.data;
          this.analyzeResult.message = res.message;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.analyzing = false;
          this.analyzeError = err?.error?.message || "Erreur lors de l'analyse";
          this.cdr.detectChanges();
        },
      });
  }

  generatePdf(): void {
    if (!this.project) return;
    this.generatingPdf = true;
    this.cdr.detectChanges();

    // Charger la checklist du projet
    this.http.get<any>(`${environment.apiUrl}/projects/${this.project.id}/checklist`).subscribe({
      next: (res) => {
        const checklist = res.data.checklist || [];
        const stats = res.data.stats || {};
        const p = this.project!;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W = 210; // largeur A4
        let y = 0;

        // ---- HEADER ----
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, W, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Rapport de Conformité OWASP ASVS', 14, 16);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`Projet : ${p.name}`, 14, 25);
        doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 14, 32);
        // Badge score
        const score = stats.score || 0;
        const scoreColor =
          score >= 80 ? [16, 185, 129] : score >= 50 ? [245, 158, 11] : [239, 68, 68];
        doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        doc.roundedRect(W - 45, 8, 32, 16, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${score}%`, W - 29, 19, { align: 'center' });
        y = 50;

        // ---- INFOS PROJET ----
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, y, W - 28, 28, 3, 3, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Informations du projet', 20, y + 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Description : ${p.description || 'Aucune'}`, 20, y + 16);
        doc.text(
          `Date de création : ${new Date(p.createdAt).toLocaleDateString('fr-FR')}`,
          20,
          y + 23,
        );
        y += 36;

        // ---- STATS GLOBALES ----
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Statistiques de conformité', 14, y);
        y += 8;

        const statBoxes = [
          { label: 'Total', value: stats.total || 0, color: [59, 130, 246] },
          { label: 'Validés', value: stats.done || 0, color: [16, 185, 129] },
          { label: 'En cours', value: stats.inProgress || 0, color: [245, 158, 11] },
          { label: 'Non faits', value: stats.notDone || 0, color: [239, 68, 68] },
          { label: 'N/A', value: stats.notApplicable || 0, color: [107, 114, 128] },
        ];
        const boxW = (W - 28 - 16) / 5;
        statBoxes.forEach((b, i) => {
          const x = 14 + i * (boxW + 4);
          doc.setFillColor(b.color[0], b.color[1], b.color[2]);
          doc.roundedRect(x, y, boxW, 20, 3, 3, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`${b.value}`, x + boxW / 2, y + 11, { align: 'center' });
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(b.label, x + boxW / 2, y + 17, { align: 'center' });
        });
        y += 28;

        // ---- BARRE PROGRESSION ----
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, y, W - 28, 6, 3, 3, 'F');
        if (score > 0) {
          doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
          doc.roundedRect(14, y, ((W - 28) * score) / 100, 6, 3, 3, 'F');
        }
        y += 14;

        // ---- TABLEAU REQUIREMENTS ----
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Détail des requirements OWASP ASVS', 14, y);
        y += 8;

        // En-tête tableau
        const cols = { id: 14, lvl: 36, status: 52, desc: 72 };
        doc.setFillColor(15, 23, 42);
        doc.rect(14, y, W - 28, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('ID OWASP', cols.id + 1, y + 5.5);
        doc.text('Niv.', cols.lvl + 1, y + 5.5);
        doc.text('Statut', cols.status + 1, y + 5.5);
        doc.text('Description', cols.desc + 1, y + 5.5);
        y += 10;

        // Lignes requirements
        const statusMap: any = {
          DONE: { label: 'Validé', color: [16, 185, 129] },
          IN_PROGRESS: { label: 'En cours', color: [245, 158, 11] },
          NOT_DONE: { label: 'Non fait', color: [239, 68, 68] },
          NOT_APPLICABLE: { label: 'N/A', color: [107, 114, 128] },
        };

        checklist.forEach((req: any, idx: number) => {
          if (y > 270) {
            doc.addPage();
            y = 14;
          }
          const rowH = 9;
          const bg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
          doc.setFillColor(bg[0], bg[1], bg[2]);
          doc.rect(14, y, W - 28, rowH, 'F');

          doc.setTextColor(51, 65, 85);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.text(req.owaspId || '-', cols.id + 1, y + 6);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(`L${req.asvsLevel}`, cols.lvl + 1, y + 6);

          const st = statusMap[req.status] || {
            label: req.status || 'Non init.',
            color: [148, 163, 184],
          };
          doc.setTextColor(st.color[0], st.color[1], st.color[2]);
          doc.setFont('helvetica', 'bold');
          doc.text(st.label, cols.status + 1, y + 6);

          doc.setTextColor(51, 65, 85);
          doc.setFont('helvetica', 'normal');
          const desc =
            (req.description || '').substring(0, 80) + (req.description?.length > 80 ? '...' : '');
          doc.text(desc, cols.desc + 1, y + 6);

          // Ligne séparation légère
          doc.setDrawColor(241, 245, 249);
          doc.line(14, y + rowH, W - 14, y + rowH);
          y += rowH;
        });

        // ---- FOOTER ----
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFillColor(241, 245, 249);
          doc.rect(0, 287, W, 10, 'F');
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text('OWASP ASVS Manager — Rapport confidentiel', 14, 293);
          doc.text(`Page ${i} / ${pageCount}`, W - 14, 293, { align: 'right' });
        }

        doc.save(
          `rapport-owasp-${p.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
        );
        this.generatingPdf = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.generatingPdf = false;
        this.cdr.detectChanges();
      },
    });
  }

  delete(): void {
    if (!this.project) return;
    if (!confirm(`Supprimer "${this.project.name}" ?`)) return;

    this.projectService.delete(this.project.id).subscribe({
      next: () => this.router.navigate(['/projects']),
      error: (err) => {
        this.error = err?.error?.message || 'Erreur suppression';
        this.cdr.detectChanges();
      },
    });
  }
}
