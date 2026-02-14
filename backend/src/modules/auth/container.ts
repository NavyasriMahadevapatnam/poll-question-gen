import { ContainerModule } from 'inversify';
import { AUTH_TYPES } from './types.js';
import { FirebaseAuthProvider } from './infrastructure/auth/FirebaseAuthProvider.js';
import { AuthService } from './application/services/AuthService.js';
import { AuthController } from './presentation/controllers/AuthController.js';

export const authContainerModule = new ContainerModule((options) => {
  // Infrastructure
  options.bind(AUTH_TYPES.AuthProvider).to(FirebaseAuthProvider).inSingletonScope();

  // Services
  options.bind(AUTH_TYPES.AuthService).to(AuthService).inSingletonScope();

  // Controllers
  options.bind(AuthController).toSelf().inSingletonScope();
});
