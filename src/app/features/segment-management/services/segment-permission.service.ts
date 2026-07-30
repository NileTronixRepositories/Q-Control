import { computed, inject, Injectable } from '@angular/core';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { resolveJwtPermissions } from '../../auth/utils/auth-permissions.util';
import { SegmentPermission } from '../models/segment.model';

@Injectable({ providedIn: 'root' })
export class SegmentPermissionService {
  private readonly authSessionService = inject(AuthSessionService);

  readonly isTechnicalAdmin = computed(
    () => this.authSessionService.currentSession()?.userType === 'TechnicalAdmin',
  );

  readonly isBranchAdmin = computed(
    () => this.authSessionService.currentSession()?.userType === 'BranchAdmin',
  );

  readonly permissions = computed(() =>
    resolveJwtPermissions(this.authSessionService.currentSession()?.token),
  );

  readonly canViewAllSegments = computed(
    () =>
      this.isTechnicalAdmin() ||
      this.isBranchAdmin() ||
      this.hasPermission('Segments.ViewAll'),
  );

  readonly canViewSegmentDetails = computed(
    () => this.isTechnicalAdmin() || this.hasPermission('Segments.ViewDetails'),
  );

  readonly canCreateGlobalSegment = computed(
    () => this.isTechnicalAdmin() || this.hasPermission('Segments.CreateGlobal'),
  );

  readonly canCreateBranchScopedSegment = computed(
    () => this.isBranchAdmin() || this.hasPermission('Segments.CreateBranchScoped'),
  );

  readonly canUpdateSegment = computed(
    () => this.isTechnicalAdmin() || this.hasPermission('Segments.Update'),
  );

  readonly canViewBranchServiceSegments = computed(
    () => this.isTechnicalAdmin() || this.hasPermission('BranchServiceSegments.View'),
  );

  readonly canViewAvailableSegments = computed(
    () => this.isTechnicalAdmin() || this.hasPermission('BranchServiceSegments.ViewAvailable'),
  );

  readonly canAssignBranchServiceSegments = computed(
    () => this.isTechnicalAdmin() || this.hasPermission('BranchServiceSegments.Assign'),
  );

  readonly canUpdateSegmentQuota = computed(
    () => this.isTechnicalAdmin() || this.hasPermission('BranchServiceSegments.UpdateQuota'),
  );

  readonly canUnassignSegment = computed(
    () => this.isTechnicalAdmin() || this.hasPermission('BranchServiceSegments.Unassign'),
  );

  readonly canViewAllGlobalizationRequests = computed(
    () =>
      this.isTechnicalAdmin() ||
      this.hasPermission('SegmentGlobalizationRequests.ViewAll'),
  );

  readonly canViewOwnGlobalizationRequests = computed(
    () =>
      (this.isBranchAdmin() ||
        this.hasPermission('SegmentGlobalizationRequests.ViewOwn')) &&
      !!this.authSessionService.currentSession()?.activeBranchId,
  );

  readonly canViewGlobalizationRequestDetails = computed(
    () =>
      this.isTechnicalAdmin() ||
      this.hasPermission('SegmentGlobalizationRequests.ViewDetails'),
  );

  readonly canApproveGlobalizationRequest = computed(
    () =>
      this.isTechnicalAdmin() ||
      this.hasPermission('SegmentGlobalizationRequests.Approve'),
  );

  readonly canRejectGlobalizationRequest = computed(
    () =>
      this.isTechnicalAdmin() ||
      this.hasPermission('SegmentGlobalizationRequests.Reject'),
  );

  hasPermission(permission: SegmentPermission): boolean {
    if (this.isTechnicalAdmin()) {
      return true;
    }
    return this.permissions().has(permission);
  }
}
