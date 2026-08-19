import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AuthStep, JwtPayload } from './models';
import { jwtDecode } from 'jwt-decode';
import { Observable, tap, catchError, throwError } from 'rxjs';

const TOKEN_KEY = 'certibot_token';
const IDENTIFIER_KEY = 'certibot_identifier';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ─── Private writable signals ─────────────────────────────────────────────
  private readonly _step = signal<AuthStep>('email');
  private readonly _identifier = signal<string | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _pending = signal(false);
  private readonly _error = signal<string | null>(null);

  // ─── Public readonly signals ──────────────────────────────────────────────
  readonly step = this._step.asReadonly();
  readonly identifier = this._identifier.asReadonly();
  readonly token = this._token.asReadonly();
  readonly pending = this._pending.asReadonly();
  readonly error = this._error.asReadonly();

  // ─── Computed signals ─────────────────────────────────────────────────────
  readonly isAuthenticated = computed(() => this._token() !== null);

  readonly userEmail = computed(() => {
    const token = this._token();
    if (!token) return null;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.correo_sena ?? decoded.email ?? null;
    } catch {
      return null;
    }
  });

  readonly userRole = computed(() => {
    const token = this._token();
    if (!token) return null;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.rol_asignado ?? decoded.role ?? null;
    } catch {
      return null;
    }
  });

  constructor() {
    this.restoreSession();
  }

  // ─── Session restore ──────────────────────────────────────────────────────

  private restoreSession(): void {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      if (!token) return;

      const decoded = jwtDecode<JwtPayload>(token);
      if (Date.now() >= decoded.exp * 1000) {
        this.clearStorage();
        return;
      }

      this._token.set(token);
      const savedIdentifier = sessionStorage.getItem(IDENTIFIER_KEY);
      if (savedIdentifier) this._identifier.set(savedIdentifier);
    } catch {
      this.clearStorage();
    }
  }

  // ─── Step 1: Request OTP ──────────────────────────────────────────────────

  requestOtp(identifier: string): Observable<unknown> {
    this._pending.set(true);
    this._error.set(null);

    return this.authService.requestOtp(identifier).pipe(
      tap(() => {
        this._identifier.set(identifier);
        this._step.set('otp');
        this._pending.set(false);
      }),
      catchError((error) => {
        this._pending.set(false);
        const msg =
          error?.error?.message ||
          error?.message ||
          'No se pudo enviar el código OTP. Verifica tu correo SENA.';
        this._error.set(msg);
        return throwError(() => error);
      }),
    );
  }

  // ─── Step 2: Verify OTP & get JWT ─────────────────────────────────────────

  verifyOtp(otpCode: string): Observable<unknown> {
    const identifier = this._identifier();
    if (!identifier) {
      this._error.set('Sesión expirada. Por favor ingresa tu correo de nuevo.');
      return throwError(() => new Error('No identifier'));
    }

    this._pending.set(true);
    this._error.set(null);

    return this.authService.verifyOtp(identifier, otpCode).pipe(
      tap((response) => {
        const token = response.accessToken;
        this._token.set(token);
        this._pending.set(false);
        this._step.set('email');

        sessionStorage.setItem(TOKEN_KEY, token);
        sessionStorage.setItem(IDENTIFIER_KEY, identifier);

        this.router.navigate(['/users']);
      }),
      catchError((error) => {
        this._pending.set(false);
        const msg =
          error?.error?.message ||
          error?.message ||
          'Código OTP inválido o expirado. Inténtalo de nuevo.';
        this._error.set(msg);
        return throwError(() => error);
      }),
    );
  }

  // ─── Go back to email step ────────────────────────────────────────────────

  backToEmail(): void {
    this._step.set('email');
    this._error.set(null);
    this._identifier.set(null);
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  logout(): void {
    this.clearStorage();
    this._token.set(null);
    this._identifier.set(null);
    this._step.set('email');
    this._error.set(null);
    this._pending.set(false);
    this.router.navigate(['/login']);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private clearStorage(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(IDENTIFIER_KEY);
  }
}
