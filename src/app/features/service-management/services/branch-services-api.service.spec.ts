import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  CreateBranchServiceSubtreeResponse,
  CreateBranchServiceTreeResponse,
  UnassignBranchLeafServiceResponse,
} from '../models/branch-services.model';
import { BranchServicesApiService } from './branch-services-api.service';

describe('BranchServicesApiService', () => {
  let service: BranchServicesApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BranchServicesApiService,
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: signal({ token: 'branch-services-token' }).asReadonly(),
          },
        },
        {
          provide: AppLanguageStore,
          useValue: { language: signal<'ar' | 'en'>('en').asReadonly() },
        },
      ],
    });

    service = TestBed.inject(BranchServicesApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('sends DELETE without a body and maps the unassignment response', () => {
    const expectedResponse: UnassignBranchLeafServiceResponse = {
      branchId: 5,
      leafServiceId: 100,
      unassignedServiceIds: [100, 10, 1],
      removedAssignmentsCount: 3,
    };
    let actualResponse: UnassignBranchLeafServiceResponse | undefined;

    service.unassignLeafService(5, 100).subscribe((response) => {
      actualResponse = response;
    });

    const endpoint = new URL('api/branches/5/services/100', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne(endpoint);

    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    expect(request.request.headers.get('Accept-Language')).toBe('en');
    expect(request.request.headers.get('Authorization')).toBe('Bearer branch-services-token');

    request.flush(expectedResponse);
    expect(actualResponse).toEqual(expectedResponse);
  });

  it('maps the non-null globalization request returned after creating a branch tree', () => {
    const response: CreateBranchServiceTreeResponse = {
      branchId: 5, scope: 'BranchScoped', ownerBranchId: 5,
      createdServicesCount: 1, createdAssignmentsCount: 1,
      root: { id: 301, parentServiceId: null, arabicName: 'خدمة', englishName: 'Service', serviceCode: 'SVC-001', isServiceCodeRequired: true, scope: 'BranchScoped', ownerBranchId: 5, isTicketIssuable: true, children: [] },
      globalizationRequest: { requestId: 45, requestType: 'BranchServiceTree', status: 'Pending', requestedOnUtc: '2026-07-13T09:30:00Z' },
      message: 'Created',
    };
    service.createBranchServiceTree(5, {
      root: { arabicName: 'خدمة', englishName: 'Service', serviceCode: 'SVC-001', isServiceCodeRequired: true, arabicUserMessage: null, englishUserMessage: null, isTicketIssuable: true, isClientInputRequired: false, hasReservation: false, orderNo: 1, priority: 1, rangePrefix: 'S', rangeStartNumber: 1, rangeEndNumber: 9, waitingDuration: 5, noOfTicketCopies: 1, children: [] },
    }).subscribe((result) => expect(result.globalizationRequest.requestId).toBe(45));
    const endpoint = new URL('api/branches/5/service-trees', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne(endpoint);
    expect(request.request.method).toBe('POST');
    request.flush(response);
  });
  it('maps a branch-scoped subtree response when no globalization request is created', () => {
    const response: CreateBranchServiceSubtreeResponse = {
      branchId: 5,
      parentServiceId: 301,
      scope: 'BranchScoped',
      ownerBranchId: 5,
      createdServicesCount: 1,
      createdAssignmentsCount: 1,
      root: {
        id: 302,
        parentServiceId: 301,
        arabicName: 'خدمة فرعية',
        englishName: 'Branch child',
        serviceCode: null,
        isServiceCodeRequired: false,
        scope: 'BranchScoped',
        ownerBranchId: 5,
        isTicketIssuable: false,
        children: [],
      },
      globalizationRequest: null,
      message: 'Created',
    };

    service
      .createBranchServiceSubtree(5, 301, {
        root: {
          arabicName: 'خدمة فرعية',
          englishName: 'Branch child',
          serviceCode: null,
          isServiceCodeRequired: false,
          arabicUserMessage: null,
          englishUserMessage: null,
          isTicketIssuable: false,
          isClientInputRequired: false,
          hasReservation: false,
          orderNo: 1,
          priority: 1,
          rangePrefix: null,
          rangeStartNumber: null,
          rangeEndNumber: null,
          waitingDuration: null,
          noOfTicketCopies: null,
          children: [],
        },
      })
      .subscribe((result) => expect(result.globalizationRequest).toBeNull());

    const endpoint = new URL('api/branches/5/services/301/subtree', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne(endpoint);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.root.children).toEqual([]);
    request.flush(response);
  });
});