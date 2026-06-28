export type OperationalStatusFilter = boolean | null;

export interface OperationalEntityState {
  readonly isActive: boolean;
  readonly effectiveIsActive: boolean;
  readonly rowVersion: string;
}

export interface LifecycleMutationResponse extends OperationalEntityState {
  readonly id: number;
  readonly message: string;
}

export interface PermanentDeleteResponse {
  readonly id: number;
  readonly message: string;
}