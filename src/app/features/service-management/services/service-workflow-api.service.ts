import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { PagedServiceResponse } from '../models/service-management.model';
import {
  CreateServiceWorkflowRequest,
  ServiceRelatedWorkflow,
  ServiceWorkflowDetails,
  ServiceWorkflowListItem,
  ServiceWorkflowListQuery,
  ServiceWorkflowMutationResponse,
  ServiceWorkflowStatusResponse,
  UpdateServiceWorkflowRequest,
  WorkflowCandidateQuery,
  WorkflowCandidateRelatedWorkflow,
  WorkflowCandidateService,
  WorkflowStartOptionItem,
  WorkflowStartMode,
  WorkflowStartOptions,
} from '../models/service-workflow.model';

const WORKFLOWS_PATH = 'api/service-workflows';
const SERVICES_PATH = 'api/services';
type UnknownRecord = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class ServiceWorkflowApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly workflowsEndpoint = new URL(WORKFLOWS_PATH, environment.apiBaseUrl).toString();
  private readonly servicesEndpoint = new URL(SERVICES_PATH, environment.apiBaseUrl).toString();

  getWorkflows(
    query: ServiceWorkflowListQuery,
  ): Observable<PagedServiceResponse<ServiceWorkflowListItem>> {
    return this.httpClient
      .get<unknown>(this.workflowsEndpoint, {
        headers: this.createJsonHeaders(),
        params: this.createWorkflowListParams(query),
      })
      .pipe(
        map((response) =>
          this.normalizePage(response, query.pageNumber, query.pageSize, (item) =>
            this.normalizeWorkflowListItem(item),
          ),
        ),
      );
  }

  getWorkflowDetails(workflowId: number): Observable<ServiceWorkflowDetails> {
    return this.httpClient
      .get<unknown>(this.createWorkflowUrl(workflowId), { headers: this.createJsonHeaders() })
      .pipe(map((response) => this.normalizeWorkflowDetails(response)));
  }

  createWorkflow(request: CreateServiceWorkflowRequest): Observable<ServiceWorkflowMutationResponse> {
    return this.httpClient.post<ServiceWorkflowMutationResponse>(this.workflowsEndpoint, request, {
      headers: this.createJsonHeaders(),
    });
  }

  updateWorkflow(
    workflowId: number,
    request: UpdateServiceWorkflowRequest,
  ): Observable<ServiceWorkflowMutationResponse> {
    return this.httpClient.put<ServiceWorkflowMutationResponse>(
      this.createWorkflowUrl(workflowId),
      request,
      { headers: this.createJsonHeaders() },
    );
  }

  deactivateWorkflow(
    workflowId: number,
    rowVersion: string,
  ): Observable<ServiceWorkflowStatusResponse> {
    return this.httpClient.post<ServiceWorkflowStatusResponse>(
      `${this.createWorkflowUrl(workflowId)}/deactivate`,
      null,
      { headers: this.createJsonHeaders(rowVersion) },
    );
  }

  reactivateWorkflow(
    workflowId: number,
    rowVersion: string,
  ): Observable<ServiceWorkflowStatusResponse> {
    return this.httpClient.post<ServiceWorkflowStatusResponse>(
      `${this.createWorkflowUrl(workflowId)}/reactivate`,
      null,
      { headers: this.createJsonHeaders(rowVersion) },
    );
  }

  getCandidateServices(
    query: WorkflowCandidateQuery,
  ): Observable<PagedServiceResponse<WorkflowCandidateService>> {
    return this.httpClient
      .get<unknown>(`${this.workflowsEndpoint}/candidate-services`, {
        headers: this.createJsonHeaders(),
        params: this.createCandidateParams(query),
      })
      .pipe(
        map((response) =>
          this.normalizePage(response, query.pageNumber, query.pageSize, (item) =>
            this.normalizeCandidateService(item),
          ),
        ),
      );
  }

  getServiceWorkflows(serviceId: number): Observable<readonly ServiceRelatedWorkflow[]> {
    return this.httpClient
      .get<unknown>(`${this.createServiceUrl(serviceId)}/workflows`, {
        headers: this.createJsonHeaders(),
      })
      .pipe(map((response) => this.normalizeServiceRelatedWorkflows(response, serviceId)));
  }

  getWorkflowStartOptions(serviceId: number): Observable<WorkflowStartOptions> {
    return this.httpClient
      .get<unknown>(`${this.createServiceUrl(serviceId)}/workflow-start-options`, {
        headers: this.createJsonHeaders(),
      })
      .pipe(map((response) => this.normalizeWorkflowStartOptions(response, serviceId)));
  }

  private normalizeWorkflowStartOptions(response: unknown, serviceId: number): WorkflowStartOptions {
    const source = this.unwrapResponse(response);
    const record = this.asRecord(source);
    const mode = this.normalizeWorkflowStartMode(this.readString(record, ['mode', 'startMode']));
    const workflows = this.readArray(record, ['workflows', 'items', 'data', 'results']).map((item) =>
      this.normalizeWorkflowStartOption(item),
    );

    return {
      serviceId: this.readNumber(record, ['serviceId', 'id']) ?? serviceId,
      mode,
      requiresWorkflowSelection:
        this.readBoolean(record, ['requiresWorkflowSelection', 'selectionRequired']) ??
        mode === 'SelectionRequired',
      autoApplyWorkflowId:
        this.readNumber(record, ['autoApplyWorkflowId', 'defaultWorkflowId']) ?? null,
      workflows,
    };
  }

  private normalizeWorkflowStartMode(value: string | null): WorkflowStartMode {
    if (value === 'AutoApply' || value === 'SelectionRequired' || value === 'NoWorkflow') {
      return value;
    }

    return 'NoWorkflow';
  }

  private normalizeWorkflowStartOption(source: unknown): WorkflowStartOptionItem {
    const record = this.asRecord(source);
    const steps = this.readArray(record, ['steps', 'workflowSteps', 'serviceSteps']).map((step) =>
      this.normalizeWorkflowStep(step),
    );
    const firstStep = steps[0];

    return {
      workflowId: this.readNumber(record, ['workflowId', 'id', 'serviceWorkflowId']) ?? 0,
      arabicName:
        this.readString(record, ['arabicName', 'nameAr', 'workflowArabicName', 'arabicWorkflowName']) ?? '',
      englishName:
        this.readString(record, ['englishName', 'nameEn', 'workflowEnglishName', 'englishWorkflowName']) ?? '',
      isActive: this.readBoolean(record, ['isActive', 'active']) ?? true,
      startServiceId:
        this.readNumber(record, ['startServiceId', 'firstServiceId']) ?? firstStep?.serviceId ?? null,
      stepsCount: this.readNumber(record, ['stepsCount', 'stepCount', 'numberOfSteps']) ?? steps.length,
      steps,
    };
  }

  private normalizePage<TItem>(
    response: unknown,
    fallbackPage: number,
    fallbackPageSize: number,
    normalizeItem: (item: unknown) => TItem,
  ): PagedServiceResponse<TItem> {
    const source = this.unwrapResponse(response);
    const sourceRecord = this.asRecord(source);
    const rawItems = this.readArray(source, ['data', 'items', 'results', 'records', 'value']);
    const data = rawItems.map((item) => normalizeItem(item));
    const currentPage = this.readNumber(sourceRecord, ['currentPage', 'pageNumber', 'pageIndex']) ?? fallbackPage;
    const pageSize = this.readNumber(sourceRecord, ['pageSize', 'size', 'take']) ?? fallbackPageSize;
    const totalItems = this.readNumber(sourceRecord, ['totalItems', 'totalCount', 'count']) ?? data.length;
    const totalPages =
      this.readNumber(sourceRecord, ['totalPages', 'pagesCount']) ??
      Math.max(0, Math.ceil(totalItems / Math.max(pageSize, 1)));

    return {
      currentPage,
      pageSize,
      totalPages,
      totalItems,
      data,
      hasPreviousPage:
        this.readBoolean(sourceRecord, ['hasPreviousPage', 'hasPrevious']) ?? currentPage > 1,
      hasNextPage:
        this.readBoolean(sourceRecord, ['hasNextPage', 'hasNext']) ?? currentPage < totalPages,
    };
  }

  private normalizeWorkflowDetails(source: unknown): ServiceWorkflowDetails {
    const item = this.normalizeWorkflowListItem(this.unwrapResponse(source));
    const record = this.asRecord(this.unwrapResponse(source));

    return {
      ...item,
      steps: item.steps ?? [],
      deactivatedOnUtc: this.readString(record, ['deactivatedOnUtc', 'deactivatedAt']) ?? null,
      reactivatedOnUtc: this.readString(record, ['reactivatedOnUtc', 'reactivatedAt']) ?? null,
      deactivatedBy: this.readString(record, ['deactivatedBy']) ?? null,
      reactivatedBy: this.readString(record, ['reactivatedBy']) ?? null,
    };
  }

  private normalizeWorkflowListItem(source: unknown): ServiceWorkflowListItem {
    const record = this.asRecord(source);
    const steps = this.readArray(record, ['steps', 'workflowSteps', 'serviceSteps']).map((step) =>
      this.normalizeWorkflowStep(step),
    );
    const firstStep = steps[0];

    return {
      id: this.readNumber(record, ['id', 'workflowId', 'serviceWorkflowId']) ?? 0,
      workflowId: this.readNumber(record, ['workflowId', 'id', 'serviceWorkflowId']) ?? 0,
      arabicName:
        this.readString(record, ['arabicName', 'nameAr', 'workflowArabicName', 'arabicWorkflowName']) ?? '',
      englishName:
        this.readString(record, ['englishName', 'nameEn', 'workflowEnglishName', 'englishWorkflowName']) ?? '',
      startServiceId:
        this.readNumber(record, ['startServiceId', 'firstServiceId']) ?? firstStep?.serviceId ?? null,
      startServiceArabicName:
        this.readString(record, ['startServiceArabicName', 'startServiceNameAr', 'startServiceAr']) ??
        firstStep?.serviceArabicName ??
        firstStep?.arabicName ??
        null,
      startServiceEnglishName:
        this.readString(record, ['startServiceEnglishName', 'startServiceNameEn', 'startServiceEn']) ??
        firstStep?.serviceEnglishName ??
        firstStep?.englishName ??
        null,
      stepsCount: this.readNumber(record, ['stepsCount', 'stepCount', 'numberOfSteps']) ?? steps.length,
      isActive: this.readBoolean(record, ['isActive', 'active']) ?? true,
      createdOnUtc: this.readString(record, ['createdOnUtc', 'createdAt']) ?? null,
      modifiedOnUtc: this.readString(record, ['modifiedOnUtc', 'updatedOnUtc', 'modifiedAt']) ?? null,
      rowVersion: this.readString(record, ['rowVersion', 'version']) ?? '',
      steps,
    };
  }

  private normalizeWorkflowStep(source: unknown) {
    const record = this.asRecord(source);

    return {
      serviceId: this.readNumber(record, ['serviceId', 'id']) ?? 0,
      stepOrder: this.readNumber(record, ['stepOrder', 'order', 'orderNo']) ?? 0,
      arabicName: this.readString(record, ['arabicName', 'nameAr']) ?? null,
      englishName: this.readString(record, ['englishName', 'nameEn']) ?? null,
      serviceArabicName:
        this.readString(record, ['serviceArabicName', 'serviceNameAr']) ??
        this.readString(record, ['arabicName', 'nameAr']) ??
        null,
      serviceEnglishName:
        this.readString(record, ['serviceEnglishName', 'serviceNameEn']) ??
        this.readString(record, ['englishName', 'nameEn']) ??
        null,
      parentServiceId: this.readNumber(record, ['parentServiceId']) ?? null,
      parentServiceArabicName:
        this.readString(record, ['parentServiceArabicName', 'parentServiceNameAr', 'parentArabicName']) ?? null,
      parentServiceEnglishName:
        this.readString(record, ['parentServiceEnglishName', 'parentServiceNameEn', 'parentEnglishName']) ?? null,
      isActive: this.readBoolean(record, ['isActive', 'active']) ?? true,
      isDeleted: this.readBoolean(record, ['isDeleted', 'deleted']) ?? false,
      effectiveIsActive: this.readBoolean(record, ['effectiveIsActive']) ?? true,
      isTicketIssuable: this.readBoolean(record, ['isTicketIssuable', 'ticketIssuable']) ?? true,
      isMatchedService: this.readBoolean(record, ['isMatchedService']) ?? false,
    };
  }

  private normalizeServiceRelatedWorkflows(response: unknown, serviceId: number): readonly ServiceRelatedWorkflow[] {
    return this.extractArrayPayload(response).map((item) =>
      this.normalizeServiceRelatedWorkflow(item, serviceId),
    );
  }

  private normalizeServiceRelatedWorkflow(source: unknown, serviceId: number): ServiceRelatedWorkflow {
    const record = this.asRecord(source);
    const details = this.normalizeWorkflowDetails(source);
    const matchedOrders = details.steps
      .filter((step) => step.isMatchedService === true || step.serviceId === serviceId)
      .map((step) => step.stepOrder)
      .sort((a, b) => a - b);
    const containsServiceStepOrders =
      this.readNumberArray(record, ['containsServiceStepOrders', 'matchedStepOrders', 'stepOrders']) ??
      matchedOrders;

    return {
      ...details,
      containsServiceOccurrenceCount:
        this.readNumber(record, ['containsServiceOccurrenceCount', 'occurrenceCount', 'matchedCount']) ??
        containsServiceStepOrders.length,
      containsServiceStepOrders,
      isStartService:
        this.readBoolean(record, ['isStartService', 'startsWithService']) ??
        containsServiceStepOrders.includes(1),
    };
  }

  private normalizeCandidateService(source: unknown): WorkflowCandidateService {
    const record = this.asRecord(source);
    const relatedWorkflows = this.readArray(record, ['relatedWorkflows', 'workflows']).map((item) =>
      this.normalizeCandidateWorkflow(item),
    );

    return {
      serviceId: this.readNumber(record, ['serviceId', 'id']) ?? 0,
      id: this.readNumber(record, ['id', 'serviceId']) ?? 0,
      arabicName: this.readString(record, ['arabicName', 'serviceArabicName', 'nameAr']) ?? '',
      englishName: this.readString(record, ['englishName', 'serviceEnglishName', 'nameEn']) ?? '',
      parentServiceId: this.readNumber(record, ['parentServiceId']) ?? null,
      parentServiceArabicName:
        this.readString(record, ['parentServiceArabicName', 'parentServiceNameAr', 'parentArabicName']) ?? null,
      parentServiceEnglishName:
        this.readString(record, ['parentServiceEnglishName', 'parentServiceNameEn', 'parentEnglishName']) ?? null,
      isActive: this.readBoolean(record, ['isActive', 'active']) ?? true,
      isDeleted: this.readBoolean(record, ['isDeleted', 'deleted']) ?? false,
      isTicketIssuable: this.readBoolean(record, ['isTicketIssuable', 'ticketIssuable']) ?? false,
      relatedWorkflows,
    };
  }

  private normalizeCandidateWorkflow(source: unknown): WorkflowCandidateRelatedWorkflow {
    const record = this.asRecord(source);

    return {
      workflowId: this.readNumber(record, ['workflowId', 'id']) ?? 0,
      arabicName: this.readString(record, ['arabicName', 'nameAr']) ?? '',
      englishName: this.readString(record, ['englishName', 'nameEn']) ?? '',
      isActive: this.readBoolean(record, ['isActive', 'active']) ?? true,
      stepsCount: this.readNumber(record, ['stepsCount', 'stepCount']) ?? 0,
    };
  }

  private extractArrayPayload(source: unknown, depth = 0): readonly unknown[] {
    if (Array.isArray(source)) {
      return source;
    }

    if (depth > 4 || !this.isRecord(source)) {
      return this.looksLikeWorkflowRecord(source) ? [source] : [];
    }

    const record = this.asRecord(source);
    for (const key of ['workflows', 'data', 'items', 'results', 'records', 'value', 'result'] as const) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value;
      }
      if (this.isRecord(value)) {
        const nested = this.extractArrayPayload(value, depth + 1);
        if (nested.length > 0) {
          return nested;
        }
      }
    }

    return this.looksLikeWorkflowRecord(record) ? [record] : [];
  }

  private looksLikeWorkflowRecord(source: unknown): boolean {
    const record = this.asRecord(source);
    const workflowId = this.readNumber(record, ['workflowId', 'id', 'serviceWorkflowId']);
    const hasName =
      this.readString(record, ['arabicName', 'englishName', 'nameAr', 'nameEn', 'workflowArabicName', 'workflowEnglishName']) !==
      null;
    const hasSteps = this.readArray(record, ['steps', 'workflowSteps', 'serviceSteps']).length > 0;

    return workflowId !== null && (hasName || hasSteps);
  }

  private unwrapResponse(response: unknown): unknown {
    const record = this.asRecord(response);
    const result = record['result'];

    if (this.isRecord(result) || Array.isArray(result)) {
      return result;
    }

    return response;
  }

  private readArray(source: unknown, keys: readonly string[]): readonly unknown[] {
    if (Array.isArray(source)) {
      return source;
    }

    const record = this.asRecord(source);
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value;
      }
    }

    return [];
  }

  private readNumberArray(record: UnknownRecord, keys: readonly string[]): readonly number[] | null {
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value)) {
        const numbers = value
          .map((item) => (typeof item === 'number' ? item : typeof item === 'string' ? Number(item) : Number.NaN))
          .filter((item) => Number.isFinite(item));
        return numbers.length > 0 ? numbers : null;
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        const numbers = value
          .split(',')
          .map((item) => Number(item.trim()))
          .filter((item) => Number.isFinite(item));
        return numbers.length > 0 ? numbers : null;
      }
    }

    return null;
  }
  private readString(record: UnknownRecord, keys: readonly string[]): string | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    return null;
  }

  private readNumber(record: UnknownRecord, keys: readonly string[]): number | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  private readBoolean(record: UnknownRecord, keys: readonly string[]): boolean | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
          return true;
        }
        if (value.toLowerCase() === 'false') {
          return false;
        }
      }
    }

    return null;
  }

  private asRecord(value: unknown): UnknownRecord {
    return this.isRecord(value) ? value : {};
  }

  private isRecord(value: unknown): value is UnknownRecord {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private createWorkflowUrl(workflowId: number): string {
    return new URL(String(workflowId), `${this.workflowsEndpoint}/`).toString();
  }

  private createServiceUrl(serviceId: number): string {
    return new URL(String(serviceId), `${this.servicesEndpoint}/`).toString();
  }

  private createJsonHeaders(rowVersion?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept-Language': this.appLanguageStore.language(),
      'Content-Type': 'application/json',
    });

    const token = this.authSessionService.currentSession()?.token;

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    if (rowVersion) {
      headers = headers.set('If-Match', rowVersion);
    }

    return headers;
  }

  private createWorkflowListParams(query: ServiceWorkflowListQuery): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', Math.min(query.pageSize, 100));

    if (query.searchText.trim()) {
      params = params.set('searchText', query.searchText.trim());
    }

    if (query.isActive !== null) {
      params = params.set('isActive', query.isActive);
    }

    if (query.startServiceId) {
      params = params.set('startServiceId', query.startServiceId);
    }

    if (query.orderSort?.trim()) {
      params = params.set('orderSort', query.orderSort.trim());
    }

    return params;
  }

  private createCandidateParams(query: WorkflowCandidateQuery): HttpParams {
    let params = new HttpParams()
      .set('includeInactive', query.includeInactive)
      .set('includeDeleted', query.includeDeleted)
      .set('pageNumber', query.pageNumber)
      .set('pageSize', Math.min(query.pageSize, 100));

    if (query.searchText.trim()) {
      params = params.set('searchText', query.searchText.trim());
    }

    if (query.parentServiceId) {
      params = params.set('parentServiceId', query.parentServiceId);
    }

    return params;
  }
}












