-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsTable" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsColumn" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tableId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsRow" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tableId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsCell" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rowId" UUID NOT NULL,
    "columnId" UUID NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsCell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "CmsTable_projectId_idx" ON "CmsTable"("projectId");

-- CreateIndex
CREATE INDEX "CmsColumn_tableId_idx" ON "CmsColumn"("tableId");

-- CreateIndex
CREATE INDEX "CmsRow_tableId_idx" ON "CmsRow"("tableId");

-- CreateIndex
CREATE INDEX "CmsCell_rowId_idx" ON "CmsCell"("rowId");

-- CreateIndex
CREATE INDEX "CmsCell_columnId_idx" ON "CmsCell"("columnId");

-- CreateIndex
CREATE UNIQUE INDEX "CmsCell_rowId_columnId_key" ON "CmsCell"("rowId", "columnId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsTable" ADD CONSTRAINT "CmsTable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsColumn" ADD CONSTRAINT "CmsColumn_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "CmsTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsRow" ADD CONSTRAINT "CmsRow_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "CmsTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsCell" ADD CONSTRAINT "CmsCell_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "CmsRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsCell" ADD CONSTRAINT "CmsCell_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "CmsColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
