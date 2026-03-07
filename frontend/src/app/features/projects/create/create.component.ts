import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create.component.html',
})
export class CreateComponent {
  form = {
    name: '',
    description: '',
  };

  loading = false;
  error: string | null = null;

  constructor(
    private projectsService: ProjectService,
    private router: Router,
  ) {}

  submit(): void {
    if (!this.form.name.trim()) {
      this.error = 'Le nom du projet est obligatoire.';
      return;
    }

    this.loading = true;
    this.error = null;

    this.projectsService
      .create({
        name: this.form.name.trim(),
        description: this.form.description?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/projects']);
        },
        error: (err) => {
          this.loading = false;
          this.error =
            err?.error?.error?.message ||
            err?.error?.message ||
            err?.message ||
            'Erreur lors de la création du projet';
        },
      });
  }
}
