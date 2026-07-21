import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { ServiceWorkflowApiService } from './service-workflow-api.service';

describe('ServiceWorkflowApiService branch scope', () => {
  let service: ServiceWorkflowApiService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthSessionService,
          useValue: { currentSession: signal({ token: 'token' }).asReadonly() },
        },
        {
          provide: AppLanguageStore,
          useValue: { language: signal<'ar' | 'en'>('en').asReadonly() },
        },
      ],
    });
    service = TestBed.inject(ServiceWorkflowApiService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  it('loads a leaf workflow page using only the new scoped query', () => {
    service
      .getWorkflows(10, 25, {
        searchText: 'fast',
        isActive: true,
        pageNumber: 2,
        pageSize: 10,
        orderSort: 'Oldest',
      })
      .subscribe((page) => {
        expect(page.data[0]).toEqual(
          expect.objectContaining({
            workflowId: 11,
            branchId: 10,
            leafServiceId: 25,
            isDefault: true,
          }),
        );
      });

    const request = httpController.expectOne(
      (candidate) =>
        candidate.url.endsWith('/api/branches/10/services/25/workflows') &&
        candidate.params.get('searchText') === 'fast',
    );
    expect(request.request.params.get('orderSort')).toBe('Oldest');
    expect(request.request.params.has('startServiceId')).toBe(false);
    request.flush({
      currentPage: 2,
      pageSize: 10,
      totalPages: 1,
      totalItems: 1,
      data: [
        {
          workflowId: 11,
          branchId: 10,
          leafServiceId: 25,
          arabicName: 'مسار',
          englishName: 'Workflow',
          isDefault: true,
          isActive: true,
          rowVersion: 'v1',
          steps: [],
        },
      ],
    });
  });

  it('creates and updates without sending ownership or default fields', () => {
    const createRequest = {
      arabicName: 'مسار',
      englishName: 'Workflow',
      steps: [
        { serviceId: 25, stepOrder: 1 },
        { serviceId: 30, stepOrder: 2 },
      ],
    };
    service.createWorkflow(10, 25, createRequest).subscribe();

    const createCall = httpController.expectOne(
      (request) =>
        request.method === 'POST' &&
        request.url.endsWith('/api/branches/10/services/25/workflows'),
    );
    expect(createCall.request.body).toEqual(createRequest);
    expect(createCall.request.body).not.toHaveProperty('isDefault');
    expect(createCall.request.body).not.toHaveProperty('branchId');
    createCall.flush({
      workflowId: 11,
      branchId: 10,
      leafServiceId: 25,
      isDefault: true,
      isActive: true,
      rowVersion: 'v1',
    });

    service.updateWorkflow(10, 25, 11, { ...createRequest, rowVersion: 'v1' }).subscribe();
    const updateCall = httpController.expectOne(
      (request) =>
        request.method === 'PUT' &&
        request.url.endsWith('/api/branches/10/services/25/workflows/11'),
    );
    expect(updateCall.request.body.rowVersion).toBe('v1');
    expect(updateCall.request.body).not.toHaveProperty('isActive');
    updateCall.flush({
      workflowId: 11,
      branchId: 10,
      leafServiceId: 25,
      arabicName: 'مسار',
      englishName: 'Workflow',
      isDefault: true,
      isActive: true,
      rowVersion: 'v2',
      steps: [],
    });
  });

  it('loads branch candidates with trimmed search, no inactive flags, and service codes', () => {
    service
      .getCandidateServices(10, {
        searchText: '  certificate  ',
        parentServiceId: 5,
        pageNumber: 1,
        pageSize: 25,
      })
      .subscribe((page) => {
        expect(page.data).toEqual([
          expect.objectContaining({ serviceId: 30, serviceCode: 'CERT-001' }),
          expect.objectContaining({ serviceId: 31, serviceCode: null }),
        ]);
      });

    const request = httpController.expectOne(
      (candidate) => candidate.url.endsWith('/api/branches/10/services/workflow-candidates'),
    );
    expect(request.request.params.get('searchText')).toBe('certificate');
    expect(request.request.params.get('parentServiceId')).toBe('5');
    expect(request.request.params.has('includeInactive')).toBe(false);
    expect(request.request.params.has('includeDeleted')).toBe(false);
    request.flush({
      data: [
        { serviceId: 30, arabicName: 'خدمة', englishName: 'Certificate', serviceCode: 'CERT-001' },
        { serviceId: 31, arabicName: 'خدمة', englishName: 'No Code' },
      ],
    });
  });

  it('sends the latest rowVersion through If-Match for every state action', () => {
    service.setDefaultWorkflow(10, 25, 11, 'v1').subscribe();
    const setDefault = httpController.expectOne(
      (request) => request.url.endsWith('/api/branches/10/services/25/workflows/11/set-default'),
    );
    expect(setDefault.request.headers.get('If-Match')).toBe('v1');
    expect(setDefault.request.body).toBeNull();
    setDefault.flush({
      workflowId: 11,
      branchId: 10,
      leafServiceId: 25,
      arabicName: 'مسار',
      englishName: 'Workflow',
      isDefault: true,
      isActive: true,
      rowVersion: 'v2',
      steps: [],
    });

    service.deactivateWorkflow(10, 25, 12, 'v2').subscribe();
    const deactivate = httpController.expectOne(
      (request) => request.url.endsWith('/api/branches/10/services/25/workflows/12/deactivate'),
    );
    expect(deactivate.request.headers.get('If-Match')).toBe('v2');
    deactivate.flush({
      workflowId: 12,
      branchId: 10,
      leafServiceId: 25,
      isDefault: false,
      isActive: false,
      rowVersion: 'v3',
    });

    service.reactivateWorkflow(10, 25, 12, 'v3').subscribe();
    const reactivate = httpController.expectOne(
      (request) => request.url.endsWith('/api/branches/10/services/25/workflows/12/reactivate'),
    );
    expect(reactivate.request.headers.get('If-Match')).toBe('v3');
    reactivate.flush({
      workflowId: 12,
      branchId: 10,
      leafServiceId: 25,
      isDefault: false,
      isActive: true,
      rowVersion: 'v4',
    });
  });

  it('loads start options from the scoped owner endpoint', () => {
    service.getWorkflowStartOptions(10, 25).subscribe((options) => {
      expect(options).toEqual(
        expect.objectContaining({
          branchId: 10,
          leafServiceId: 25,
          defaultWorkflowId: 11,
          mode: 'DefaultAvailable',
        }),
      );
    });

    const request = httpController.expectOne(
      (candidate) =>
        candidate.url.endsWith('/api/branches/10/services/25/workflow-start-options'),
    );
    request.flush({
      serviceId: 25,
      branchId: 10,
      leafServiceId: 25,
      hasWorkflows: true,
      defaultWorkflowId: 11,
      mode: 'DefaultAvailable',
      requiresWorkflowSelection: false,
      autoApplyWorkflowId: 11,
      workflows: [],
    });
  });
});

