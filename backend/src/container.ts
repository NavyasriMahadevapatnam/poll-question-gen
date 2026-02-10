import { ContainerModule } from 'inversify';
import { MongoDatabase } from '#infrastructure/database/mongodb/MongoDatabase.js';
import { UserRepository } from '#shared/database/providers/mongo/repositories/UserRepository.js';
import { HttpErrorHandler } from '#shared/middleware/errorHandler.js';
import { GLOBAL_TYPES } from './types.js';
import { dbConfig } from './config/db.js';
import { FirebaseAuthService } from './modules/auth/services/FirebaseAuthService.js';

export const sharedContainerModule = new ContainerModule((options) => {
  const uri = dbConfig.url;
  const dbName = 'PollDB';

  options.bind(GLOBAL_TYPES.uri).toConstantValue(uri);
  options.bind(GLOBAL_TYPES.dbName).toConstantValue(dbName);

  // Auth
  options.bind(FirebaseAuthService).toSelf().inSingletonScope();

  // Database
  options.bind(GLOBAL_TYPES.Database).to(MongoDatabase).inSingletonScope();

  // Repositories
  options.bind(GLOBAL_TYPES.UserRepo).to(UserRepository).inSingletonScope();

  // Other
  options.bind(HttpErrorHandler).toSelf().inSingletonScope();
});
