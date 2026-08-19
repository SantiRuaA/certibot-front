import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./features/users/users-list/users-list.component').then(
        (m) => m.UsersListComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
