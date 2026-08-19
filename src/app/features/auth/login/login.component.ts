import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/auth.store';
import { ButtonDirective } from '../../../shared/ui/button';
import { SpinnerComponent } from '../../../shared/ui/spinner';

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ' +
  'transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const OTP_LENGTH = 6;

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, SpinnerComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly router = inject(Router);

  // ─── Local form signals ───────────────────────────────────────────────────
  protected readonly identifier = signal('');

  /** One signal cell per OTP digit */
  protected readonly digits = signal<string[]>(Array(OTP_LENGTH).fill(''));

  /** Full OTP code joined from the individual digits */
  protected readonly otpCode = computed(() => this.digits().join(''));

  protected readonly inputClass = INPUT_CLASS;
  protected readonly year = new Date().getFullYear();
  protected readonly otpLength = OTP_LENGTH;

  /** Query all #digitInput elements inside @for block */
  private readonly digitInputs = viewChildren<ElementRef<HTMLInputElement>>('digitInput');

  // ─── Auto-focus first digit box when step changes to 'otp' ───────────────
  constructor() {
    effect(() => {
      if (this.auth.step() === 'otp') {
        // Wait one microtask for the DOM to render the OTP step
        queueMicrotask(() => this.digitInputs()[0]?.nativeElement.focus());
      }
    });
  }

  // ─── Computed validation ──────────────────────────────────────────────────
  protected readonly canRequestOtp = computed(
    () =>
      this.identifier().trim().length > 5 &&
      this.identifier().includes('@') &&
      !this.auth.pending(),
  );

  protected readonly canVerifyOtp = computed(
    () => this.otpCode().length === OTP_LENGTH && !this.auth.pending(),
  );

  // ─── OTP digit handlers ───────────────────────────────────────────────────

  protected onDigitInput(index: number, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    // Keep only last digit typed (replaces previous value if any)
    const digit = raw.replace(/\D/g, '').slice(-1);

    this.digits.update((d) => {
      const next = [...d];
      next[index] = digit;
      return next;
    });

    // Advance focus to next box
    if (digit && index < OTP_LENGTH - 1) {
      this.digitInputs()[index + 1]?.nativeElement.focus();
    }
  }

  protected onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      if (this.digits()[index]) {
        // Clear current box
        this.digits.update((d) => {
          const next = [...d];
          next[index] = '';
          return next;
        });
      } else if (index > 0) {
        // Move to previous box and clear it
        this.digits.update((d) => {
          const next = [...d];
          next[index - 1] = '';
          return next;
        });
        this.digitInputs()[index - 1]?.nativeElement.focus();
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.digitInputs()[index - 1]?.nativeElement.focus();
      event.preventDefault();
    } else if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      this.digitInputs()[index + 1]?.nativeElement.focus();
      event.preventDefault();
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    this.digits.set(
      Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? ''),
    );

    // Focus last filled input (or last box if full)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    setTimeout(() => this.digitInputs()[focusIndex]?.nativeElement.focus(), 0);
  }

  // ─── Form submit handlers ─────────────────────────────────────────────────

  protected submitEmail(event: Event): void {
    event.preventDefault();
    if (!this.canRequestOtp()) return;

    this.auth.requestOtp(this.identifier().trim()).subscribe({
      error: () => {
        // Error is already set in AuthStore
      },
    });
  }

  protected submitOtp(event: Event): void {
    event.preventDefault();
    if (!this.canVerifyOtp()) return;

    this.auth.verifyOtp(this.otpCode()).subscribe({
      next: () => {
        this.resetOtp();
        this.identifier.set('');
      },
      error: () => {
        // Error is already set in AuthStore
        // Clear digits so user retypes
        this.resetOtp();
        queueMicrotask(() => this.digitInputs()[0]?.nativeElement.focus());
      },
    });
  }

  protected goBack(): void {
    this.resetOtp();
    this.auth.backToEmail();
  }

  private resetOtp(): void {
    this.digits.set(Array(OTP_LENGTH).fill(''));
  }
}
