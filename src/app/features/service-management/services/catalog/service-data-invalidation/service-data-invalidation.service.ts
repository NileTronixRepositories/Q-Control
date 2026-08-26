import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ServiceDataInvalidationService {
  readonly catalogRevision = signal(0);
  readonly centralTreeRevision = signal(0);
  readonly branchTreeInvalidation = signal<{ readonly branchId: number; readonly revision: number } | null>(null);
  readonly branchRequestsInvalidation = signal<{ readonly branchId: number; readonly revision: number } | null>(null);

  invalidateAfterApproval(branchId: number): void {
    this.catalogRevision.update((value) => value + 1);
    this.centralTreeRevision.update((value) => value + 1);
    this.invalidateBranchTree(branchId);
    this.invalidateBranchRequests(branchId);
  }

  invalidateAfterRejection(branchId: number): void {
    this.invalidateBranchRequests(branchId);
  }

  invalidateBranchTree(branchId: number): void {
    const revision = (this.branchTreeInvalidation()?.revision ?? 0) + 1;
    this.branchTreeInvalidation.set({ branchId, revision });
  }

  invalidateBranchRequests(branchId: number): void {
    const revision = (this.branchRequestsInvalidation()?.revision ?? 0) + 1;
    this.branchRequestsInvalidation.set({ branchId, revision });
  }
}
