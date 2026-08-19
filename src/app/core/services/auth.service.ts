import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { VerifyOtpResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';

  private handleError(operation: string) {
    return (error: HttpErrorResponse) => {
      console.error(`[AuthService] ${operation} failed:`, error);
      return throwError(() => error);
    };
  }

  /**
   * Step 1: Send OTP to the user's SENA email.
   * POST /auth/request-otp  { identifier }
   */
  requestOtp(identifier: string): Observable<unknown> {
    return this.http
      .post(`${this.apiUrl}/request-otp`, { identifier })
      .pipe(catchError(this.handleError('requestOtp')));
  }

  /**
   * Step 2: Verify OTP code and obtain JWT.
   * POST /auth/verify-otp  { identifier, otpCode }
   */
  verifyOtp(identifier: string, otpCode: string): Observable<VerifyOtpResponse> {
    return this.http
      .post<VerifyOtpResponse>(`${this.apiUrl}/verify-otp`, { identifier, otpCode })
      .pipe(catchError(this.handleError('verifyOtp')));
  }
}
