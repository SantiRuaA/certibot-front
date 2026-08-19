import { Injectable, computed, inject, signal } from '@angular/core';
import { AppUser } from './models';
import { UserService } from './services/user.service';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly userService = inject(UserService);

  // ─── Private writable signals ─────────────────────────────────────────────
  private readonly _users = signal<AppUser[]>([]);
  private readonly _query = signal('');
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loaded = signal(false);

  // ─── Public readonly signals ──────────────────────────────────────────────
  readonly users = this._users.asReadonly();
  readonly query = this._query.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  // ─── Computed signals ─────────────────────────────────────────────────────

  readonly filtered = computed(() => {
    const term = this._query().trim().toLowerCase();
    if (!term) return this._users();
    return this._users().filter(
      (u) =>
        u.fullName.toLowerCase().includes(term) ||
        u.correoSena.toLowerCase().includes(term) ||
        u.rolAsignado.toLowerCase().includes(term) ||
        u.usuarioAsignado.toLowerCase().includes(term) ||
        u.numeroContrato.toLowerCase().includes(term),
    );
  });

  readonly total = computed(() => this._users().length);
  readonly active = computed(() => this._users().filter((u) => u.estadoActual).length);
  readonly inactive = computed(() => this._users().filter((u) => !u.estadoActual).length);
  readonly admins = computed(
    () => this._users().filter((u) => u.rolAsignado === 'ADMIN' || u.rolAsignado === 'Administrador').length,
  );

  // ─── Actions ──────────────────────────────────────────────────────────────

  setQuery(value: string): void {
    this._query.set(value);
  }

  loadUsers(): Observable<AppUser[]> {
    if (this._loaded()) {
      return new Observable((subscriber) => {
        subscriber.next(this._users());
        subscriber.complete();
      });
    }

    this._loading.set(true);
    this._error.set(null);

    return this.userService.getUsers().pipe(
      tap((users) => {
        this._users.set(users);
        this._loading.set(false);
        this._loaded.set(true);
      }),
      catchError((err) => {
        this._loading.set(false);
        this._error.set('Error al cargar los usuarios. Verifica tu conexión.');
        return throwError(() => err);
      }),
    );
  }

  reload(): Observable<AppUser[]> {
    this._loaded.set(false);
    return this.loadUsers();
  }
}
