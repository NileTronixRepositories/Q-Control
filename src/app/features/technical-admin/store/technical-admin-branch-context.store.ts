import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { BranchManagementApiService } from '../services/branch-management-api.service';

export interface TechnicalAdminBranchContext {
  readonly branchId: number;
  readonly arabicName: string;
  readonly englishName: string;
  readonly isActive: boolean;
  readonly effectiveIsActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class TechnicalAdminBranchContextStore {
  private readonly branchApi = inject(BranchManagementApiService);
  private readonly router = inject(Router);
  private requestId = 0;

  readonly selectedBranchId = signal<number | null>(null);
  readonly selectedBranch = signal<TechnicalAdminBranchContext | null>(null);
  readonly loading = signal(false);
  readonly hasSelection = computed(() => this.selectedBranchId() !== null);

  selectBranch(branch: TechnicalAdminBranchContext): void {
    this.requestId += 1;
    this.loading.set(false);
    this.selectedBranchId.set(branch.branchId);
    this.selectedBranch.set(branch);
  }

  activate(branchId: number): void {
    if (!Number.isInteger(branchId) || branchId <= 0) {
      this.clear();
      return;
    }

    if (
      this.selectedBranchId() === branchId &&
      (this.selectedBranch() !== null || this.loading())
    ) {
      return;
    }

    const requestId = ++this.requestId;
    this.selectedBranchId.set(branchId);
    this.selectedBranch.set(null);
    this.loading.set(true);

    this.branchApi.getBranchDetails(branchId).subscribe({
      next: (details) => {
        if (requestId !== this.requestId || this.selectedBranchId() !== branchId) {
          return;
        }

        this.selectBranch({
          branchId: details.branchId,
          arabicName: details.arabicName,
          englishName: details.englishName,
          isActive: details.isActive,
          effectiveIsActive: details.effectiveIsActive,
        });
      },
      error: () => {
        if (requestId !== this.requestId || this.selectedBranchId() !== branchId) {
          return;
        }

        this.clear();
        void this.router.navigate(['/admin/branch-editor']);
      },
    });
  }

  clear(): void {
    this.requestId += 1;
    this.loading.set(false);
    this.selectedBranchId.set(null);
    this.selectedBranch.set(null);
  }
}