import { TestBed } from '@angular/core/testing';

import { ServiceWorkflowStore } from './service-workflow.store';

describe('ServiceWorkflowStore scope isolation', () => {
  let store: ServiceWorkflowStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ServiceWorkflowStore] });
    store = TestBed.inject(ServiceWorkflowStore);
  });

  it('clears workflow state whenever branch and leaf scope changes', () => {
    store.setScope({
      branchId: 1,
      leafServiceId: 25,
      branchName: 'Branch 1',
      ownerServiceName: 'Service',
    });
    store.page.update((page) => ({
      ...page,
      totalItems: 1,
      data: [
        {
          workflowId: 11,
          branchId: 1,
          leafServiceId: 25,
          arabicName: 'مسار',
          englishName: 'Workflow',
          isDefault: true,
          startServiceId: 25,
          startServiceArabicName: 'خدمة',
          startServiceEnglishName: 'Service',
          stepsCount: 0,
          isActive: true,
          steps: [],
          rowVersion: 'v1',
          createdOnUtc: null,
          modifiedOnUtc: null,
        },
      ],
    }));

    store.setScope({
      branchId: 2,
      leafServiceId: 25,
      branchName: 'Branch 2',
      ownerServiceName: 'Service',
    });

    expect(store.page().data).toEqual([]);
    expect(store.scope()).toEqual(expect.objectContaining({ branchId: 2, leafServiceId: 25 }));
  });

  it('clears scoped data when the branch selector changes', () => {
    store.setScope({
      branchId: 1,
      leafServiceId: 25,
      branchName: 'Branch 1',
      ownerServiceName: 'Service',
    });

    store.selectBranch(2);

    expect(store.scope()).toBeNull();
    expect(store.selectedBranchId()).toBe(2);
  });
});
