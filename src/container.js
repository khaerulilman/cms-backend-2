// Frameworks & Drivers
import prismaClient from './frameworks/database/prisma/client.js';

// Adapters - Services
import HashUtil from './adapters/services/hash.service.js';
import JwtService from './adapters/services/jwt.service.js';
import FileService from './adapters/services/file.service.js';
import CloudinaryService from './adapters/services/cloudinary.service.js';
import ValidatorService from './adapters/services/validator.service.js';
import ImageCleanupService from './adapters/services/imageCleanup.service.js';

// Adapters - Repositories
import AuthRepository from './adapters/repositories/auth.repository.js';
import ApiKeyRepository from './adapters/repositories/apikey.repository.js';
import ProjectRepository from './adapters/repositories/project.repository.js';
import TableRepository from './adapters/repositories/table.repository.js';
import ColumnRepository from './adapters/repositories/column.repository.js';
import RowRepository from './adapters/repositories/row.repository.js';
import CellRepository from './adapters/repositories/cell.repository.js';

// Use Cases
import AuthUseCase from './use-cases/auth/auth.usecase.js';
import ApiKeyUseCase from './use-cases/apikey/apikey.usecase.js';
import ProjectUseCase from './use-cases/project/project.usecase.js';
import TableUseCase from './use-cases/table/table.usecase.js';
import ColumnUseCase from './use-cases/columns/column.usecase.js';
import RowUseCase from './use-cases/rows/row.usecase.js';
import CellUseCase from './use-cases/cells/cell.usecase.js';

// Adapters - Controllers
import AuthController from './adapters/controllers/auth.controller.js';
import ApiKeyController from './adapters/controllers/apikey.controller.js';
import ProjectController from './adapters/controllers/project.controller.js';
import TableController from './adapters/controllers/table.controller.js';
import ColumnController from './adapters/controllers/column.controller.js';
import RowController from './adapters/controllers/row.controller.js';
import CellController from './adapters/controllers/cell.controller.js';
import DiagnosticController from './adapters/controllers/diagnostic.controller.js';

// ─── 1. Instantiate Services ──────────────────────────────────────────────────
const hashService = HashUtil;
const jwtService = JwtService;
const fileService = FileService;
const cloudinaryService = CloudinaryService;
const validatorService = ValidatorService;
const imageCleanupService = new ImageCleanupService(prismaClient);

// ─── 2. Instantiate Repositories ──────────────────────────────────────────────
const authRepository = new AuthRepository(prismaClient);
const apiKeyRepository = new ApiKeyRepository(prismaClient);
const projectRepository = new ProjectRepository(prismaClient);
const tableRepository = new TableRepository(prismaClient);
const columnRepository = new ColumnRepository(prismaClient);
const rowRepository = new RowRepository(prismaClient);
const cellRepository = new CellRepository(prismaClient);

// ─── 3. Instantiate Use Cases ─────────────────────────────────────────────────
const authUseCase = new AuthUseCase({
  authRepository,
  hashService,
  jwtService,
});

const apiKeyUseCase = new ApiKeyUseCase({
  apiKeyRepository,
  authRepository,
});

const projectUseCase = new ProjectUseCase({
  projectRepository,
  imageCleanupService,
  validatorService,
});

const tableUseCase = new TableUseCase({
  tableRepository,
  cloudinaryService,
  imageCleanupService,
});

const columnUseCase = new ColumnUseCase({
  columnRepository,
  imageCleanupService,
});

const rowUseCase = new RowUseCase({
  rowRepository,
  imageCleanupService,
});

const cellUseCase = new CellUseCase({
  cellRepository,
  cloudinaryService,
});

// ─── 4. Instantiate Controllers ───────────────────────────────────────────────
const authController = new AuthController({ authUseCase, jwtService });
const apiKeyController = new ApiKeyController({ apiKeyUseCase });
const projectController = new ProjectController({ projectUseCase });
const tableController = new TableController({ tableUseCase });
const columnController = new ColumnController({ columnUseCase });
const rowController = new RowController({ rowUseCase });
const cellController = new CellController({ cellUseCase });
const diagnosticController = new DiagnosticController();

// ─── 5. Export Container ──────────────────────────────────────────────────────
export const container = {
  prisma: prismaClient,
  services: {
    hashService,
    jwtService,
    fileService,
    cloudinaryService,
    validatorService,
    imageCleanupService,
  },
  repositories: {
    authRepository,
    apiKeyRepository,
    projectRepository,
    tableRepository,
    columnRepository,
    rowRepository,
    cellRepository,
  },
  useCases: {
    authUseCase,
    apiKeyUseCase,
    projectUseCase,
    tableUseCase,
    columnUseCase,
    rowUseCase,
    cellUseCase,
  },
  controllers: {
    authController,
    apiKeyController,
    projectController,
    tableController,
    columnController,
    rowController,
    cellController,
    diagnosticController,
  },
};

export default container;
