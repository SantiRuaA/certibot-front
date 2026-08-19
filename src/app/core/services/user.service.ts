import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AppUser, UserApiResponse, mapApiUser } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/users';

  private handleError(operation: string) {
    return (error: HttpErrorResponse) => {
      console.error(`[UserService] ${operation} failed:`, error);
      return throwError(() => error);
    };
  }

  /** GET /users — requires Bearer JWT (added by interceptor) */
  getUsers(): Observable<AppUser[]> {
    return this.http.get<UserApiResponse[]>(this.apiUrl).pipe(
      map((apiUsers) => apiUsers.map(mapApiUser)),
      catchError(this.handleError('getUsers')),
    );
  }

  /** GET /users/:id */
  getUserById(id: string): Observable<AppUser> {
    return this.http.get<UserApiResponse>(`${this.apiUrl}/${id}`).pipe(
      map(mapApiUser),
      catchError(this.handleError('getUserById')),
    );
  }
}
