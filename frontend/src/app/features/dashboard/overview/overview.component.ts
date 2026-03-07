import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit, AfterViewInit {
  role = '';
  user: any = null;
  data: any = null;
  loading = true;
  error = '';

  private donutChart: Chart | null = null;
  private barChart: Chart | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.role = this.user?.role || '';
    this.loadStats();
  }

  ngAfterViewInit(): void {}

  loadStats(): void {
    this.http.get<any>(`${environment.apiUrl}/dashboard/stats`).subscribe({
      next: (res) => {
        this.data = res.data;

        if (this.data?.projects) {
          // Le backend envoie déjà totalInProgress et totalNA
          // On calcule totalNotDone si pas présent
          if (!this.data.stats.totalNotDone) {
            const totalDone = this.data.stats.totalDone || 0;
            const totalInProgress = this.data.stats.totalInProgress || 0;
            const totalNA = this.data.stats.totalNA || 0;
            const totalAll = this.data.projects.reduce((acc: number, p: any) => acc + p.total, 0);
            this.data.stats.totalNotDone = Math.max(
              0,
              totalAll - totalDone - totalInProgress - totalNA,
            );
          }
        }

        // Pour ADMIN: stats depuis statusBreakdown
        if (this.data?.stats?.statusBreakdown) {
          const bd = this.data.stats.statusBreakdown;
          this.data.stats.totalInProgress = this.data.stats.totalInProgress || bd.inProgress || 0;
          this.data.stats.totalNotDone = this.data.stats.totalNotDone || bd.notDone || 0;
          this.data.stats.totalNA = this.data.stats.totalNA || bd.notApplicable || 0;
        }

        this.loading = false;
        this.cdr.detectChanges();

        if (this.role === 'ADMIN') {
          setTimeout(() => this.initCharts(), 100);
        }
      },
      error: () => {
        this.error = 'Erreur lors du chargement du dashboard';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  initCharts(): void {
    this.initDonutChart();
    this.initBarChart();
  }

  initDonutChart(): void {
    const canvas = document.getElementById('donutCanvas') as HTMLCanvasElement;
    if (!canvas || !this.data?.stats?.statusBreakdown) return;
    if (this.donutChart) this.donutChart.destroy();
    const bd = this.data.stats.statusBreakdown;
    this.donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['✅ Fait', '🔄 En cours', '❌ Non fait', '➖ N/A'],
        datasets: [
          {
            data: [bd.done || 0, bd.inProgress || 0, bd.notDone || 0, bd.notApplicable || 0],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'],
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        cutout: '70%',
        plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } } },
        animation: { animateRotate: true, duration: 800 },
      },
    });
  }

  initBarChart(): void {
    const canvas = document.getElementById('barCanvas') as HTMLCanvasElement;
    if (!canvas || !this.data?.byCategory?.length) return;
    if (this.barChart) this.barChart.destroy();
    const cats = this.data.byCategory.slice(0, 8);
    const labels = cats.map((c: any) =>
      c.area.length > 20 ? c.area.substring(0, 20) + '...' : c.area,
    );
    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Fait',
            data: cats.map((c: any) => c.done),
            backgroundColor: '#10b981',
            borderRadius: 6,
          },
          {
            label: 'Restant',
            data: cats.map((c: any) => c.total - c.done),
            backgroundColor: '#e2e8f0',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { stacked: true, grid: { color: '#f1f5f9' } },
        },
        animation: { duration: 800 },
      },
    });
  }

  // Retourne l'id du premier projet pour le lien Analyse GitHub
  get firstProjectId(): string {
    return this.data?.projects?.[0]?.id || '';
  }

  get notifCount(): number {
    return this.data?.notifications?.length || 0;
  }

  scoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  scoreCss(score: number): string {
    if (score >= 80) return 'score-green';
    if (score >= 50) return 'score-orange';
    return 'score-red';
  }

  actionLabel(action: string): string {
    const map: any = {
      STATUS_CHANGE: '🔄 Statut modifié',
      COMMENT_UPDATE: '💬 Commentaire',
      COMMENT_ADDED: '💬 Commentaire ajouté',
      SOURCE_REF_UPDATE: '🔗 Référence code',
      TOOL_UPDATE: '🛠️ Outil',
      AI_ANALYSIS: '🤖 Analyse IA',
      CHECKLIST_INIT: '📋 Checklist initialisée',
    };
    return map[action] || action;
  }
}
