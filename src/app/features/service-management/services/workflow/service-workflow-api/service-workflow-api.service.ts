import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../../../environments/environment';
import { AppLanguageStore } from '../../../../../core/i18n/app-language.store';
import { AuthSessionService } from '../../../../auth/services/auth-session/auth-session.service';
import { PagedServiceResponse } from '../../../models/service-management/service-management.model';
import {
  CreateServiceWorkflowRequest,
  ServiceWorkflowDetails,
  ServiceWorkflowListItem,
  ServiceWorkflowListQuery,
  ServiceWorkflowMutationResponse,
  ServiceWorkflowStep,
  UpdateServiceWorkflowRequest,
  WorkflowCandidateQuery,
  WorkflowCandidateService,
  WorkflowStartOptionItem,
  WorkflowStartMode,
  WorkflowStartOptions,
} from '../../../models/service-workflow/service-workflow.model';

type UnknownRecord = Record<string, unknown>;
const BRANCHES_PATH = 'api/branches';

@Injectable({ providedIn: 'root' })
export class ServiceWorkflowApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString();

  getWorkflows(
    branchId: number,
    leafServiceId: number,
    query: ServiceWorkflowListQuery,
  ): Observable<PagedServiceResponse<ServiceWorkflowListItem>> {
    return this.httpClient
      .get<unknown>(this.createWorkflowsUrl(branchId, leafServiceId), {
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

  getWorkflowDetails(
    branchId: number,
    leafServiceId: number,
    workflowId: number,
  ): Observable<ServiceWorkflowDetails> {
    return this.httpClient
      .get<unknown>(this.createWorkflowUrl(branchId, leafServiceId, workflowId), {
        headers: this.createJsonHeaders(),
      })
      .pipe(map((response) => this.normalizeWorkflowDetails(response)));
  }

  createWorkflow(
    branchId: number,
    leafServiceId: number,
    request: CreateServiceWorkflowRequest,
  ): Observable<ServiceWorkflowMutationResponse> {
    return this.httpClient
      .post<unknown>(this.createWorkflowsUrl(branchId, leafServiceId), request, {
        headers: this.createJsonHeaders(),
      })
      .pipe(map((response) => this.normalizeMutation(response, branchId, leafServiceId)));
  }

  updateWorkflow(
    branchId: number,
    leafServiceId: number,
    workflowId: number,
    request: UpdateServiceWorkflowRequest,
  ): Observable<ServiceWorkflowDetails> {
    return this.httpClient
      .put<unknown>(this.createWorkflowUrl(branchId, leafServiceId, workflowId), request, {
        headers: this.createJsonHeaders(),
      })
      .pipe(map((response) => this.normalizeWorkflowDetails(response)));
  }

  setDefaultWorkflow(
    branchId: number,
    leafServiceId: number,
    workflowId: number,
    rowVersion: string,
  ): Observable<ServiceWorkflowDetails> {
    return this.postStateAction(branchId, leafServiceId, workflowId, 'set-default', rowVersion).pipe(
      map((response) => this.normalizeWorkflowDetails(response)),
    );
  }

  deactivateWorkflow(
    branchId: number,
    leafServiceId: number,
    workflowId: number,
    rowVersion: string,
  ): Observable<ServiceWorkflowMutationResponse> {
    return this.postStateAction(branchId, leafServiceId, workflowId, 'deactivate', rowVersion).pipe(
      map((response) => this.normalizeMutation(response, branchId, leafServiceId)),
    );
  }

  reactivateWorkflow(
    branchId: number,
    leafServiceId: number,
    workflowId: number,
    rowVersion: string,
  ): Observable<ServiceWorkflowMutationResponse> {
    return this.postStateAction(branchId, leafServiceId, workflowId, 'reactivate', rowVersion).pipe(
      map((response) => this.normalizeMutation(response, branchId, leafServiceId)),
    );
  }

  getCandidateServices(
    branchId: number,
    query: WorkflowCandidateQuery,
  ): Observable<PagedServiceResponse<WorkflowCandidateService>> {
    return this.httpClient
      .get<unknown>(`${this.createBranchServicesUrl(branchId)}/workflow-candidates`, {
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

  getWorkflowStartOptions(
    branchId: number,
    leafServiceId: number,
  ): Observable<WorkflowStartOptions> {
    return this.httpClient
      .get<unknown>(
        `${this.createBranchServicesUrl(branchId)}/${leafServiceId}/workflow-start-options`,
        { headers: this.createJsonHeaders() },
      )
      .pipe(
        map((response) => this.normalizeWorkflowStartOptions(response, branchId, leafServiceId)),
      );
  }

  private postStateAction(
    branchId: number,
    leafServiceId: number,
    workflowId: number,
    action: 'set-default' | 'deactivate' | 'reactivate',
    rowVersion: string,
  ): Observable<unknown> {
    return this.httpClient.post<unknown>(
      `${this.createWorkflowUrl(branchId, leafServiceId, workflowId)}/${action}`,
      null,
      { headers: this.createJsonHeaders(rowVersion) },
    );
  }

  private createWorkflowsUrl(branchId: number, leafServiceId: number): string {
    return `${this.createBranchServicesUrl(branchId)}/${leafServiceId}/workflows`;
  }

  private createWorkflowUrl(
    branchId: number,
    leafServiceId: number,
    workflowId: number,
  ): string {
    return `${this.createWorkflowsUrl(branchId, leafServiceId)}/${workflowId}`;
  }

  private createBranchServicesUrl(branchId: number): string {
    return `${new URL(String(branchId), `${this.branchesEndpoint}/`).toString()}/services`;
  }

  private createJsonHeaders(rowVersion?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept-Language': this.appLanguageStore.language(),
      'Content-Type': 'application/json',
    });
    const token = this.authSessionService.currentSession()?.token;

    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    if (rowVersion) headers = headers.set('If-Match', rowVersion);

    return headers;
  }

  private createWorkflowListParams(query: ServiceWorkflowListQuery): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', Math.min(query.pageSize, 100))
      .set('orderSort', query.orderSort);

    if (query.searchText.trim()) params = params.set('searchText', query.searchText.trim());
    if (query.isActive !== null) params = params.set('isActive', query.isActive);
    return params;
  }

  private createCandidateParams(query: WorkflowCandidateQuery): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', Math.min(query.pageSize, 100));

    if (query.searchText.trim()) params = params.set('searchText', query.searchText.trim());
    if (query.parentServiceId) params = params.set('parentServiceId', query.parentServiceId);
    return params;
  }

  private normalizePage<TItem>(
    response: unknown,
    fallbackPage: number,
    fallbackPageSize: number,
    normalizeItem: (item: unknown) => TItem,
  ): PagedServiceResponse<TItem> {
    const source = this.unwrapResponse(response);
    const record = this.asRecord(source);
    const data = this.readArray(source, ['data', 'items', 'results', 'records', 'value']).map(
      normalizeItem,
    );
    const currentPage = this.readNumber(record, ['currentPage', 'pageNumber', 'pageIndex']) ?? fallbackPage;
    const pageSize = this.readNumber(record, ['pageSize', 'size', 'take']) ?? fallbackPageSize;
    const totalItems = this.readNumber(record, ['totalItems', 'totalCount', 'count']) ?? data.length;
    const totalPages =
      this.readNumber(record, ['totalPages', 'pagesCount']) ??
      Math.ceil(totalItems / Math.max(1, pageSize));

    return {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      data,
      hasPreviousPage: this.readBoolean(record, ['hasPreviousPage', 'hasPrevious']) ?? currentPage > 1,
      hasNextPage: this.readBoolean(record, ['hasNextPage', 'hasNext']) ?? currentPage < totalPages,
    };
  }

  private normalizeWorkflowListItem(source: unknown): ServiceWorkflowListItem {
    const record = this.asRecord(this.unwrapResponse(source));
    const steps = this.readArray(record, ['steps', 'workflowSteps']).map((step) =>
      this.normalizeWorkflowStep(step),
    );
    const firstStep = [...steps].sort((a, b) => a.stepOrder - b.stepOrder)[0];

    return {
      workflowId: this.readNumber(record, ['workflowId', 'id']) ?? 0,
      branchId: this.readNumber(record, ['branchId']) ?? 0,
      leafServiceId: this.readNumber(record, ['leafServiceId']) ?? 0,
      arabicName: this.readString(record, ['arabicName', 'nameAr']) ?? '',
      englishName: this.readString(record, ['englishName', 'nameEn']) ?? '',
      isDefault: this.readBoolean(record, ['isDefault']) ?? false,
      startServiceId:
        this.readNumber(record, ['startServiceId']) ?? firstStep?.serviceId ?? null,
      startServiceArabicName:
        this.readString(record, ['startServiceArabicName']) ?? firstStep?.arabicName ?? null,
      startServiceEnglishName:
        this.readString(record, ['startServiceEnglishName']) ?? firstStep?.englishName ?? null,
      stepsCount: this.readNumber(record, ['stepsCount', 'stepCount']) ?? steps.length,
      isActive: this.readBoolean(record, ['isActive', 'active']) ?? true,
      steps,
      rowVersion: this.readString(record, ['rowVersion', 'version']) ?? '',
      createdOnUtc: this.readString(record, ['createdOnUtc', 'createdAt']) ?? null,
      modifiedOnUtc: this.readString(record, ['modifiedOnUtc', 'modifiedAt', 'updatedOnUtc']) ?? null,
    };
  }

  private normalizeWorkflowStep(source: unknown): ServiceWorkflowStep {
    const record = this.asRecord(source);

    return {
      serviceId: this.readNumber(record, ['serviceId', 'id']) ?? 0,
      stepOrder: this.readNumber(record, ['stepOrder', 'order', 'orderNo']) ?? 0,
      arabicName: this.readString(record, ['arabicName', 'serviceArabicName', 'nameAr']) ?? null,
      englishName: this.readString(record, ['englishName', 'serviceEnglishName', 'nameEn']) ?? null,
      parentServiceId: this.readNumber(record, ['parentServiceId']) ?? null,
      parentArabicName:
        this.readString(record, ['parentArabicName', 'parentServiceArabicName']) ?? null,
      parentEnglishName:
        this.readString(record, ['parentEnglishName', 'parentServiceEnglishName']) ?? null,
      isActive: this.readBoolean(record, ['isActive', 'active']) ?? true,
      isDeleted: this.readBoolean(record, ['isDeleted', 'deleted']) ?? false,
      effectiveIsActive: this.readBoolean(record, ['effectiveIsActive']) ?? true,
      isTicketIssuable: this.readBoolean(record, ['isTicketIssuable']) ?? true,
      isMatchedService: this.readBoolean(record, ['isMatchedService']) ?? false,
    };
  }

  private normalizeWorkflowDetails(source: unknown): ServiceWorkflowDetails {
    const unwrapped = this.unwrapResponse(source);
    const record = this.asRecord(unwrapped);
    const item = this.normalizeWorkflowListItem(unwrapped);

    return {
      ...item,
      ownerServiceArabicName: this.readString(record, ['ownerServiceArabicName']) ?? null,
      ownerServiceEnglishName: this.readString(record, ['ownerServiceEnglishName']) ?? null,
      createdByApplicationUserId:
        this.readString(record, ['createdByApplicationUserId']) ?? null,
      lastModifiedByApplicationUserId:
        this.readString(record, ['lastModifiedByApplicationUserId']) ?? null,
      deactivatedByApplicationUserId:
        this.readString(record, ['deactivatedByApplicationUserId']) ?? null,
      deactivatedOnUtc: this.readString(record, ['deactivatedOnUtc']) ?? null,
      reactivatedByApplicationUserId:
        this.readString(record, ['reactivatedByApplicationUserId']) ?? null,
      reactivatedOnUtc: this.readString(record, ['reactivatedOnUtc']) ?? null,
      message: this.readString(record, ['message']) ?? null,
    };
  }

  private normalizeMutation(
    source: unknown,
    branchId: number,
    leafServiceId: number,
  ): ServiceWorkflowMutationResponse {
    const record = this.asRecord(this.unwrapResponse(source));

    return {
      workflowId: this.readNumber(record, ['workflowId', 'id']) ?? 0,
      branchId: this.readNumber(record, ['branchId']) ?? branchId,
      leafServiceId: this.readNumber(record, ['leafServiceId']) ?? leafServiceId,
      isDefault: this.readBoolean(record, ['isDefault']) ?? false,
      isActive: this.readBoolean(record, ['isActive']) ?? true,
      rowVersion: this.readString(record, ['rowVersion', 'version']) ?? '',
      message: this.readString(record, ['message']) ?? null,
    };
  }

  private normalizeCandidateService(source: unknown): WorkflowCandidateService {
    const record = this.asRecord(source);

    return {
      serviceId: this.readNumber(record, ['serviceId', 'id']) ?? 0,
      parentServiceId: this.readNumber(record, ['parentServiceId']) ?? null,
      parentArabicName:
        this.readString(record, ['parentArabicName', 'parentServiceArabicName']) ?? null,
      parentEnglishName:
        this.readString(record, ['parentEnglishName', 'parentServiceEnglishName']) ?? null,
      arabicName: this.readString(record, ['arabicName', 'nameAr']) ?? '',
      englishName: this.readString(record, ['englishName', 'nameEn']) ?? '',
      serviceCode: this.readString(record, ['serviceCode']) ?? null,
      isActive: this.readBoolean(record, ['isActive']) ?? true,
      isDeleted: this.readBoolean(record, ['isDeleted']) ?? false,
      effectiveIsActive: this.readBoolean(record, ['effectiveIsActive']) ?? true,
      isTicketIssuable: this.readBoolean(record, ['isTicketIssuable']) ?? true,
    };
  }

  private normalizeWorkflowStartOptions(
    source: unknown,
    branchId: number,
    leafServiceId: number,
  ): WorkflowStartOptions {
    const record = this.asRecord(this.unwrapResponse(source));
    const workflows = this.readArray(record, ['workflows', 'items']).map((workflow) =>
      this.normalizeWorkflowStartOption(workflow),
    );
    const mode = this.normalizeStartMode(this.readString(record, ['mode']));

    return {
      serviceId: this.readNumber(record, ['serviceId']) ?? leafServiceId,
      branchId: this.readNumber(record, ['branchId']) ?? branchId,
      leafServiceId: this.readNumber(record, ['leafServiceId']) ?? leafServiceId,
      hasWorkflows: this.readBoolean(record, ['hasWorkflows']) ?? workflows.length > 0,
      defaultWorkflowId: this.readNumber(record, ['defaultWorkflowId']) ?? null,
      mode,
      requiresWorkflowSelection:
        this.readBoolean(record, ['requiresWorkflowSelection']) ?? false,
      autoApplyWorkflowId: this.readNumber(record, ['autoApplyWorkflowId']) ?? null,
      workflows,
    };
  }

  private normalizeWorkflowStartOption(source: unknown): WorkflowStartOptionItem {
    const record = this.asRecord(source);
    const steps = this.readArray(record, ['steps']).map((step) =>
      this.normalizeWorkflowStep(step),
    );

    return {
      workflowId: this.readNumber(record, ['workflowId', 'id']) ?? 0,
      arabicName: this.readString(record, ['arabicName', 'nameAr']) ?? '',
      englishName: this.readString(record, ['englishName', 'nameEn']) ?? '',
      isActive: this.readBoolean(record, ['isActive']) ?? true,
      isDefault: this.readBoolean(record, ['isDefault']) ?? false,
      startServiceId: this.readNumber(record, ['startServiceId']) ?? null,
      stepsCount: this.readNumber(record, ['stepsCount']) ?? steps.length,
      steps,
    };
  }

  private normalizeStartMode(value: string | null): WorkflowStartMode {
    return value === 'DefaultAvailable' ? 'DefaultAvailable' : 'NoWorkflow';
  }

  private unwrapResponse(source: unknown): unknown {
    let current = source;

    for (let depth = 0; depth < 4; depth += 1) {
      const record = this.asRecord(current);
      const nested = record['result'] ?? record['value'];

      if (!this.isRecord(nested) && !Array.isArray(nested)) break;
      current = nested;
    }

    return current;
  }

  private readArray(source: unknown, keys: readonly string[]): readonly unknown[] {
    if (Array.isArray(source)) return source;
    const record = this.asRecord(source);

    for (const key of keys) {
      if (Array.isArray(record[key])) return record[key] as readonly unknown[];
    }

    return [];
  }

  private readString(record: UnknownRecord, keys: readonly string[]): string | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
    return null;
  }

  private readNumber(record: UnknownRecord, keys: readonly string[]): number | null {
    for (const key of keys) {
      const value = record[key];
      const numberValue = typeof value === 'number' ? value : Number(value);
      if (value !== null && value !== '' && Number.isFinite(numberValue)) return numberValue;
    }
    return null;
  }

  private readBoolean(record: UnknownRecord, keys: readonly string[]): boolean | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === 'True' || value === 1) return true;
      if (value === 'false' || value === 'False' || value === 0) return false;
    }
    return null;
  }

  private asRecord(value: unknown): UnknownRecord {
    return this.isRecord(value) ? value : {};
  }

  private isRecord(value: unknown): value is UnknownRecord {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
}
