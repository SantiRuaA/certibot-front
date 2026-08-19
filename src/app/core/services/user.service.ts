import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AppUser, UserApiResponse, mapApiUser } from '../models';

export interface CreateUserPayload {
  tenantId: number;
  tipo_de_identificacion: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  fecha_nacimiento: string;
  pais_residencia: string;
  dpto_residencia: string;
  mncpio_residencia: string;
  direccion_residencia: string;
  correo_sena: string;
  correo_particular?: string;
  telefono_entidad?: string;
  extension_telefonica?: string;
  numero_celular: string;
  estado_actual: boolean;
  fecha_inicio_contrato: string;
  fecha_fin_contrato?: string;
  numero_contrato?: string;
  usuario_asignado: string;
  rol_asignado: string;
  password: string;
}

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

  /** POST /users — create a new user */
  createUser(payload: CreateUserPayload): Observable<AppUser> {
    return this.http.post<UserApiResponse>(this.apiUrl, payload).pipe(
      map(mapApiUser),
      catchError(this.handleError('createUser')),
    );
  }
}
