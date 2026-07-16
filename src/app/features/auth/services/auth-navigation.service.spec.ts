import { AuthenticatedSession, AuthenticatedUserType } from '../models/login-credentials.model';
import { AuthNavigationService } from './auth-navigation.service';

describe('AuthNavigationService', () => {
  const service = new AuthNavigationService();

  it('routes technical admins to the canonical admin console', () => {
    expect(service.resolvePostLoginUrl(createSession('TechnicalAdmin'))).toBe('/admin/branch-editor');
  });

  it('routes branch admins to the first allowed admin page', () => {
    const session = createSession('BranchAdmin', createJwt(['ServiceWorkflows.ViewAll']));

    expect(service.resolvePostLoginUrl(session)).toBe('/admin/services/workflows');
  });

  it('routes branch admins without matching permissions to no-access', () => {
    expect(service.resolvePostLoginUrl(createSession('BranchAdmin', createJwt([])))).toBe(
      '/no-access',
    );
  });
});

function createSession(
  userType: AuthenticatedUserType,
  token = createJwt([]),
): AuthenticatedSession {
  return {
    token,
    userType,
    requiresBranchSelection: false,
    activeBranchId: null,
    branches: [],
    firstLoginFlag: false,
    passwordExpiredFlag: false,
    passwordChangedOnUtc: null,
    passwordExpiresOnUtc: null,
  };
}

function createJwt(permissions: readonly string[]): string {
  const payload = btoa(JSON.stringify({ permissions }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `header.${payload}.signature`;
}