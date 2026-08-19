import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `
    <svg
      [class]="'animate-spin ' + sizeClass() + ' ' + colorClass()"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  `,
})
export class SpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly color = input<string>('text-primary');

  sizeClass(): string {
    return { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }[this.size()];
  }

  colorClass(): string {
    return this.color();
  }
}
