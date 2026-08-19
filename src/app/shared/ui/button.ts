import { Directive, computed, input } from '@angular/core';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ' +
  'disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

const VARIANTS: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground shadow hover:opacity-90',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:opacity-90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-sm',
  icon: 'h-9 w-9',
};

@Directive({
  selector: 'button[appButton], a[appButton]',
  host: { '[class]': 'classes()' },
})
export class ButtonDirective {
  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('md');
  readonly extraClass = input<string>('');

  readonly classes = computed(
    () => `${BASE} ${VARIANTS[this.variant()]} ${SIZES[this.size()]} ${this.extraClass()}`.trim(),
  );
}
