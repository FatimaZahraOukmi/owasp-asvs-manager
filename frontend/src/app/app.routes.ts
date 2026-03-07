import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/overview/overview.component').then(
            (m) => m.OverviewComponent,
          ),
      },
      {
        path: 'projects/new',
        loadComponent: () =>
          import('./features/projects/create/create.component').then((m) => m.CreateComponent),
      },
      {
        path: 'projects/:id/edit',
        loadComponent: () => import('./features/projects/edit/edit').then((m) => m.EditComponent),
      },
      {
        path: 'projects/:id/checklist',
        loadComponent: () =>
          import('./features/projects/checklist/checklist').then((m) => m.ChecklistComponent),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./features/projects/detail/detail').then((m) => m.DetailComponent),
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/list/list').then((m) => m.ListComponent),
      },
      {
        path: 'requirements',
        loadComponent: () =>
          import('./features/requirements/list/requirements-list.component').then(
            (m) => m.RequirementsListComponent,
          ),
      },
      {
        path: 'requirements/:id',
        loadComponent: () =>
          import('./features/requirements/detail/requirement-detail').then(
            (m) => m.RequirementDetailComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat.component').then((m) => m.ChatComponent),
      },
    ],
  },

  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
