import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './edit.html',
})
export class EditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  id = '';
  form = { name: '', description: '' };
  loading = false;
  loadingProject = true;
  error: string | null = null;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.projectService.getById(this.id).subscribe({
      next: (p) => {
        this.form.name = p.name;
        this.form.description = p.description ?? '';
        this.loadingProject = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Projet introuvable';
        this.loadingProject = false;
        this.cdr.detectChanges();
      },
    });
  }

  submit(): void {
    if (!this.form.name.trim()) {
      this.error = 'Le nom est obligatoire.';
      return;
    }
    this.loading = true;
    this.error = null;

    this.projectService
      .update(this.id, {
        name: this.form.name.trim(),
        description: this.form.description?.trim() || undefined,
      })
      .subscribe({
        next: () => this.router.navigate(['/projects', this.id]),
        error: (err) => {
          this.loading = false;
          this.error =
            err?.error?.error?.message ||
            err?.error?.message ||
            err?.message ||
            'Erreur lors de la modification';
          this.cdr.detectChanges();
        },
      });
  }
}
