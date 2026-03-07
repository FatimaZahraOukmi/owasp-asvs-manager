import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'DEVELOPER' | 'AUDITOR';
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error = '';
  showModal = false;
  editingUser: User | null = null;
  saving = false;
  modalError = '';

  form = {
    email: '',
    password: '',
    role: 'DEVELOPER' as 'ADMIN' | 'DEVELOPER' | 'AUDITOR',
    firstName: '',
    lastName: '',
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.http.get<any>(`${environment.apiUrl}/users`).subscribe({
      next: (res) => {
        this.users = res.data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erreur chargement';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openCreate(): void {
    this.editingUser = null;
    this.form = { email: '', password: '', role: 'DEVELOPER', firstName: '', lastName: '' };
    this.modalError = '';
    this.showModal = true;
  }

  openEdit(user: User): void {
    this.editingUser = user;
    this.form = {
      email: user.email,
      password: '',
      role: user.role,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    };
    this.modalError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingUser = null;
    this.modalError = '';
  }

  submit(): void {
    if (!this.editingUser && (!this.form.email || !this.form.password)) {
      this.modalError = 'Email et mot de passe sont obligatoires';
      return;
    }
    this.saving = true;
    this.modalError = '';

    if (this.editingUser) {
      const payload: any = {
        role: this.form.role,
        firstName: this.form.firstName,
        lastName: this.form.lastName,
      };
      if (this.form.password) payload.password = this.form.password;
      this.http
        .patch<any>(`${environment.apiUrl}/users/${this.editingUser.id}`, payload)
        .subscribe({
          next: (res) => {
            const idx = this.users.findIndex((u) => u.id === this.editingUser!.id);
            if (idx !== -1) this.users[idx] = { ...this.users[idx], ...res.data };
            this.saving = false;
            this.closeModal();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.modalError = err?.error?.message || 'Erreur modification';
            this.saving = false;
            this.cdr.detectChanges();
          },
        });
    } else {
      this.http.post<any>(`${environment.apiUrl}/users`, this.form).subscribe({
        next: (res) => {
          this.users.unshift(res.data);
          this.saving = false;
          this.closeModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.modalError = err?.error?.message || 'Erreur création';
          this.saving = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  toggleActive(user: User): void {
    this.http
      .patch<any>(`${environment.apiUrl}/users/${user.id}`, { isActive: !user.isActive })
      .subscribe({
        next: () => {
          user.isActive = !user.isActive;
          this.cdr.detectChanges();
        },
      });
  }

  getInitial(user: User): string {
    return (user.firstName?.[0] || user.email[0]).toUpperCase();
  }

  getRoleBg(role: string): string {
    return role === 'ADMIN' ? '#fef3c7' : role === 'DEVELOPER' ? '#dbeafe' : '#d1fae5';
  }

  getRoleColor(role: string): string {
    return role === 'ADMIN' ? '#92400e' : role === 'DEVELOPER' ? '#1e40af' : '#065f46';
  }
  deleteUser(user: User): void {
    if (!confirm(`Supprimer définitivement "${user.email}" ?`)) return;
    this.http.delete<any>(`${environment.apiUrl}/users/${user.id}`).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== user.id);
        this.cdr.detectChanges();
      },
      error: (err) => alert(err?.error?.message || 'Erreur suppression'),
    });
  }
}
