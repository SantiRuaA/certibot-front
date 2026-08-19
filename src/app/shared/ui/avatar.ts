import { Component, computed, input } from '@angular/core';
import { initials } from '../../core/models';

const COLORS = [
  'bg-rose-100 text-rose-700',
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-teal-100 text-teal-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

const SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
};

@Component({
  selector: 'app-avatar',
  template: `
    <span [class]="classes()">{{ text() }}</span>
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly text = computed(() => initials(this.name()) || '?');
  readonly color = computed(() => avatarColor(this.name()));
  readonly classes = computed(
    () =>
      `inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0 ${SIZES[this.size()]} ${this.color()}`,
  );
}
