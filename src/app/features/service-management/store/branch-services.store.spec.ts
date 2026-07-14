import { BranchServicesStore } from './branch-services.store';

describe('BranchServicesStore pending request visibility', () => {
  let store: BranchServicesStore;

  beforeEach(() => {
    store = new BranchServicesStore();
    store.selectBranch(5, 'Main branch');
  });

  it('hides seen requests and shows only a newer request id', () => {
    store.pendingGlobalizationRequestsCount.set(3);
    store.pendingGlobalizationRequestsNewestId.set(101);

    expect(store.hasUnreadPendingGlobalizationRequests()).toBe(true);

    store.markPendingGlobalizationRequestsAsSeen();

    expect(store.hasUnreadPendingGlobalizationRequests()).toBe(false);

    store.pendingGlobalizationRequestsCount.set(2);
    store.pendingGlobalizationRequestsNewestId.set(100);

    expect(store.hasUnreadPendingGlobalizationRequests()).toBe(false);

    store.pendingGlobalizationRequestsNewestId.set(102);

    expect(store.hasUnreadPendingGlobalizationRequests()).toBe(true);
  });

  it('uses a count increase as a fallback when no request row is returned', () => {
    store.pendingGlobalizationRequestsCount.set(3);
    store.pendingGlobalizationRequestsNewestId.set(null);
    store.markPendingGlobalizationRequestsAsSeen();

    store.pendingGlobalizationRequestsCount.set(2);
    expect(store.hasUnreadPendingGlobalizationRequests()).toBe(false);

    store.pendingGlobalizationRequestsCount.set(4);
    expect(store.hasUnreadPendingGlobalizationRequests()).toBe(true);
  });

  it('keeps independent seen snapshots while switching technical-admin branches', () => {
    store.pendingGlobalizationRequestsCount.set(3);
    store.pendingGlobalizationRequestsNewestId.set(101);
    store.markPendingGlobalizationRequestsAsSeen();

    store.selectBranch(6, 'Second branch');
    store.pendingGlobalizationRequestsCount.set(1);
    store.pendingGlobalizationRequestsNewestId.set(201);

    expect(store.hasUnreadPendingGlobalizationRequests()).toBe(true);

    store.markPendingGlobalizationRequestsAsSeen();
    store.selectBranch(5, 'Main branch');
    store.pendingGlobalizationRequestsCount.set(3);
    store.pendingGlobalizationRequestsNewestId.set(101);

    expect(store.hasUnreadPendingGlobalizationRequests()).toBe(false);
  });

  it('always hides the unread state when no pending requests remain', () => {
    store.pendingGlobalizationRequestsCount.set(1);
    store.pendingGlobalizationRequestsNewestId.set(101);
    expect(store.hasUnreadPendingGlobalizationRequests()).toBe(true);

    store.pendingGlobalizationRequestsCount.set(0);
    store.pendingGlobalizationRequestsNewestId.set(null);

    expect(store.hasUnreadPendingGlobalizationRequests()).toBe(false);
  });
});
