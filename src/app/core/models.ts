// ─── User types ────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'Administrador' | 'Dinamizador' | 'Usuario';
export type UserStatus = 'Activo' | 'Inactivo';

/** Flat model used across the UI */
export interface AppUser {
  id: string;
  fullName: string;
  correoSena: string;
  correoParticular: string;
  rolAsignado: Role;
  estadoActual: boolean;
  numeroContrato: string;
  fechaInicioContrato: string;
  fechaFinContrato: string;
  numeroCelular: string;
  usuarioAsignado: string;
  tenantId: number;
}

/** Raw shape returned by GET /users */
export interface UserApiResponse {
  _id: string;
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
  [key: string]: unknown;
}

// ─── Auth types ─────────────────────────────────────────────────────────────

/** Two-step OTP flow */
export type AuthStep = 'email' | 'otp';

/** Shape of verify-otp response */
export interface VerifyOtpResponse {
  accessToken: string;
}

/** Decoded JWT payload */
export interface JwtPayload {
  sub?: string;
  id?: string;
  email?: string;
  correo_sena?: string;
  rol_asignado?: string;
  role?: string;
  name?: string;
  tenantId?: number;
  exp: number;
  iat: number;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Build display initials from a full name */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/** Map API user response to UI AppUser */
export function mapApiUser(api: UserApiResponse): AppUser {
  const fullName = [
    api.primer_nombre,
    api.segundo_nombre,
    api.primer_apellido,
    api.segundo_apellido,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    id: api._id,
    fullName: fullName || api.usuario_asignado || api.correo_sena.split('@')[0],
    correoSena: api.correo_sena,
    correoParticular: api.correo_particular ?? '',
    rolAsignado: (api.rol_asignado as Role) || 'Usuario',
    estadoActual: api.estado_actual,
    numeroContrato: api.numero_contrato ?? '—',
    fechaInicioContrato: api.fecha_inicio_contrato,
    fechaFinContrato: api.fecha_fin_contrato ?? '—',
    numeroCelular: api.numero_celular,
    usuarioAsignado: api.usuario_asignado,
    tenantId: api.tenantId,
  };
}
