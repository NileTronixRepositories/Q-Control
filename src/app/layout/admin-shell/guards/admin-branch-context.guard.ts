import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthSessionService } from '@core';
import { BranchManagementApiService } from '@features/branch-management/public-api';
import { AdminBranchContextStore } from '../store/admin-branch-context.store';

export const adminBranchContextGuard: CanActivateFn = (_route, state) => {
  const authSession = inject(AuthSessionService).currentSession();

  if (authSession?.userType !== 'TechnicalAdmin') {
    return true;
  }

  const router = inject(Router);
  const branchId = Number(router.parseUrl(state.url).queryParams['branchId']);
  const fallbackUrl = router.createUrlTree(['/admin/branch-editor']);

  if (!Number.isInteger(branchId) || branchId <= 0) {
    return fallbackUrl;
  }

  const contextStore = inject(AdminBranchContextStore);
  const selectedBranch = contextStore.selectedBranch();

  if (selectedBranch?.branchId === branchId) {
    return true;
  }

  return inject(BranchManagementApiService)
    .getBranchDetails(branchId)
    .pipe(
      map((details) => {
        contextStore.selectBranch({
          branchId: details.branchId,
          arabicName: details.arabicName,
          englishName: details.englishName,
          isActive: details.isActive,
          effectiveIsActive: details.effectiveIsActive,
        });
        return true;
      }),
      catchError(() => {
        contextStore.clear();
        return of(fallbackUrl);
      }),
    );
};
