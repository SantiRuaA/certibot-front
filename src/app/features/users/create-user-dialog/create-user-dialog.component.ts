import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UsersStore } from '../../../core/users.store';
import { ButtonDirective } from '../../../shared/ui/button';
import { SpinnerComponent } from '../../../shared/ui/spinner';

type FormStep = 'personal' | 'contact' | 'contract' | 'account';

interface StepConfig {
  id: FormStep;
  label: string;
}

const ROLES = ['Administrador', 'Dinamizador', 'Usuario'] as const;
const ID_TYPES = [
  { value: 'C.C.', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'T.I.', label: 'Tarjeta de Identidad (TI)' },
  { value: 'C.E.', label: 'Cédula de Extranjería (CE)' },
  { value: 'P.A.', label: 'Pasaporte (PA)' },
] as const;

function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pw = group.get('password')?.value;
    const confirm = group.get('confirmar_contrasena')?.value;
    return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
  };
}

@Component({
  selector: 'app-create-user-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonDirective, SpinnerComponent],
  templateUrl: './create-user-dialog.component.html',
})
export class CreateUserDialogComponent implements OnInit {
  readonly closed = output<void>();

  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(UsersStore);

  protected readonly roles = ROLES;
  protected readonly idTypes = ID_TYPES;
  protected showPassword = signal(false);
  protected showConfirm = signal(false);

  protected readonly steps: StepConfig[] = [
    { id: 'personal', label: 'Personal' },
    { id: 'contact', label: 'Contacto' },
    { id: 'contract', label: 'Contrato' },
    { id: 'account', label: 'Cuenta' },
  ];

  protected readonly currentStep = signal<FormStep>('personal');
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitSuccess = signal(false);

  protected readonly currentStepIndex = computed(() =>
    this.steps.findIndex((s) => s.id === this.currentStep()),
  );

  protected form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        // Personal
        tipo_de_identificacion: ['C.C.', Validators.required],
        numero_identificacion: ['', [Validators.required, Validators.pattern(/^\d{5,12}$/)]],
        primer_nombre: ['', [Validators.required, Validators.minLength(2)]],
        segundo_nombre: [''],
        primer_apellido: ['', [Validators.required, Validators.minLength(2)]],
        segundo_apellido: [''],
        fecha_nacimiento: ['', Validators.required],
        // Contact
        pais_residencia: ['Colombia', Validators.required],
        dpto_residencia: ['', Validators.required],
        mncpio_residencia: ['', Validators.required],
        direccion_residencia: ['', Validators.required],
        correo_sena: ['', [Validators.required, Validators.email]],
        correo_particular: ['', Validators.email],
        telefono_entidad: [''],
        extension_telefonica: [''],
        numero_celular: ['', [Validators.required, Validators.pattern(/^\d{7,12}$/)]],
        // Contract
        estado_actual: [true, Validators.required],
        fecha_inicio_contrato: ['', Validators.required],
        fecha_fin_contrato: [''],
        numero_contrato: [''],
        rol_asignado: ['Administrador', Validators.required],
        // Account
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmar_contrasena: ['', Validators.required],
      },
      { validators: passwordMatchValidator() },
    );
  }

  // ─── Step fields ───────────────────────────────────────────────────────────

  protected readonly stepFields: Record<FormStep, string[]> = {
    personal: [
      'tipo_de_identificacion',
      'numero_identificacion',
      'primer_nombre',
      'primer_apellido',
      'fecha_nacimiento',
    ],
    contact: [
      'correo_sena',
      'numero_celular',
      'pais_residencia',
      'dpto_residencia',
      'mncpio_residencia',
      'direccion_residencia',
    ],
    contract: ['rol_asignado', 'estado_actual', 'fecha_inicio_contrato'],
    account: ['password', 'confirmar_contrasena'],
  };

  protected isStepValid(step: FormStep): boolean {
    return this.stepFields[step].every((f) => this.form.get(f)?.valid ?? true);
  }

  protected goNext(): void {
    this.stepFields[this.currentStep()].forEach((f) => this.form.get(f)?.markAsTouched());
    if (!this.isStepValid(this.currentStep())) return;
    const idx = this.currentStepIndex();
    if (idx < this.steps.length - 1) this.currentStep.set(this.steps[idx + 1].id);
  }

  protected goPrev(): void {
    const idx = this.currentStepIndex();
    if (idx > 0) this.currentStep.set(this.steps[idx - 1].id);
  }

  protected goToStep(step: FormStep): void {
    const targetIdx = this.steps.findIndex((s) => s.id === step);
    const currentIdx = this.currentStepIndex();
    if (targetIdx < currentIdx) {
      this.currentStep.set(step);
    } else if (targetIdx === currentIdx + 1 && this.isStepValid(this.currentStep())) {
      this.currentStep.set(step);
    }
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.submitError.set(null);

    const v = this.form.value;
    const payload = {
      tenantId: parseInt(v.numero_identificacion, 10),
      tipo_de_identificacion: v.tipo_de_identificacion,
      primer_nombre: v.primer_nombre.trim(),
      ...(v.segundo_nombre?.trim() ? { segundo_nombre: v.segundo_nombre.trim() } : {}),
      primer_apellido: v.primer_apellido.trim(),
      ...(v.segundo_apellido?.trim() ? { segundo_apellido: v.segundo_apellido.trim() } : {}),
      fecha_nacimiento: new Date(v.fecha_nacimiento).toISOString(),
      pais_residencia: v.pais_residencia.trim(),
      dpto_residencia: v.dpto_residencia.trim(),
      mncpio_residencia: v.mncpio_residencia.trim(),
      direccion_residencia: v.direccion_residencia.trim(),
      correo_sena: v.correo_sena.trim().toLowerCase(),
      ...(v.correo_particular?.trim() ? { correo_particular: v.correo_particular.trim() } : {}),
      ...(v.telefono_entidad?.trim() ? { telefono_entidad: v.telefono_entidad.trim() } : {}),
      ...(v.extension_telefonica?.trim() ? { extension_telefonica: v.extension_telefonica.trim() } : {}),
      numero_celular: v.numero_celular.trim(),
      estado_actual: !!v.estado_actual,
      fecha_inicio_contrato: new Date(v.fecha_inicio_contrato).toISOString(),
      ...(v.fecha_fin_contrato ? { fecha_fin_contrato: new Date(v.fecha_fin_contrato).toISOString() } : {}),
      ...(v.numero_contrato?.trim() ? { numero_contrato: v.numero_contrato.trim() } : {}),
      usuario_asignado: v.correo_sena.split('@')[0],
      rol_asignado: v.rol_asignado,
      password: v.password,
    };

    this.store.createUser(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set(true);
        setTimeout(() => this.close(), 1400);
      },
      error: (err) => {
        this.submitting.set(false);
        const apiMsg = err?.error?.message;
        const msg = Array.isArray(apiMsg)
          ? apiMsg.join(' • ')
          : (apiMsg ?? err?.message ?? 'Error al crear el usuario.');
        this.submitError.set(msg);
      },
    });
  }

  protected close(): void {
    this.closed.emit();
  }

  @HostListener('keydown.escape')
  onEsc(): void {
    this.close();
  }

  // ─── Field error helpers ───────────────────────────────────────────────────

  protected fieldError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.touched || ctrl.valid) return null;
    if (ctrl.errors?.['required']) return 'Este campo es obligatorio.';
    if (ctrl.errors?.['email']) return 'Correo electrónico inválido.';
    if (ctrl.errors?.['minlength'])
      return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres.`;
    if (ctrl.errors?.['pattern']) {
      if (name === 'numero_identificacion') return 'Solo números, entre 5 y 12 dígitos.';
      return 'Solo números, entre 7 y 12 dígitos.';
    }
    return 'Valor inválido.';
  }

  protected hasError(name: string): boolean {
    return this.fieldError(name) !== null;
  }

  protected get passwordMismatch(): boolean {
    return (
      !!this.form.errors?.['passwordMismatch'] &&
      !!this.form.get('confirmar_contrasena')?.touched
    );
  }
}
