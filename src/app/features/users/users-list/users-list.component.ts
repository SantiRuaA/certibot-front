import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/auth.store';
import { UsersStore } from '../../../core/users.store';
import { AppUser } from '../../../core/models';
import { AvatarComponent } from '../../../shared/ui/avatar';
import { BadgeComponent } from '../../../shared/ui/badge';
import { ButtonDirective } from '../../../shared/ui/button';
import { SpinnerComponent } from '../../../shared/ui/spinner';

const PAGE_SIZES = [10, 25, 50];

@Component({
  selector: 'app-users-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, BadgeComponent, ButtonDirective, SpinnerComponent],
  templateUrl: './users-list.component.html',
})
export class UsersListComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(UsersStore);
  protected readonly router = inject(Router);

  // ─── Pagination signals ───────────────────────────────────────────────────
  protected readonly pageSize = signal(PAGE_SIZES[0]);
  protected readonly currentPage = signal(1);
  protected readonly pageSizes = PAGE_SIZES;

  // ─── Computed pagination ──────────────────────────────────────────────────
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.store.filtered().length / this.pageSize())),
  );

  protected readonly paginatedUsers = computed(() => {
    const users = this.store.filtered();
    const size = this.pageSize();
    let page = this.currentPage();
    const maxPage = Math.max(1, Math.ceil(users.length / size));
    if (page > maxPage) page = maxPage;
    const start = (page - 1) * size;
    return users.slice(start, start + size);
  });

  protected readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const pages: (number | '...')[] = [];

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  });

  protected readonly stats = computed(() => [
    { label: 'Total usuarios', value: this.store.total(), icon: 'users' },
    { label: 'Activos', value: this.store.active(), icon: 'check' },
    { label: 'Inactivos', value: this.store.inactive(), icon: 'x' },
    { label: 'Administradores', value: this.store.admins(), icon: 'shield' },
  ]);

  protected readonly showingFrom = computed(() => {
    const count = this.store.filtered().length;
    if (count === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  protected readonly showingTo = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.store.filtered().length),
  );

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.store.loadUsers().subscribe();
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.store.setQuery(value);
    this.currentPage.set(1);
  }

  protected setPage(page: number | '...'): void {
    if (page === '...' || page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update((p) => p - 1);
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.currentPage.update((p) => p + 1);
  }

  protected changePageSize(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.currentPage.set(1);
  }

  protected reload(): void {
    this.store.reload().subscribe();
  }

  protected logout(): void {
    this.auth.logout();
  }

  // ─── Template helpers ─────────────────────────────────────────────────────

  protected statusVariant(active: boolean): 'success' | 'destructive' {
    return active ? 'success' : 'destructive';
  }

  protected formatDate(dateStr: string): string {
    if (!dateStr || dateStr === '—') return '—';
    try {
      return new Date(dateStr).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  protected trackById(_: number, user: AppUser): string {
    return user.id;
  }
}
