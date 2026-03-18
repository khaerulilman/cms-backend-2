/*
  Warnings:

  - The `value` column on the `CmsCell` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "CmsCell" DROP COLUMN "value",
ADD COLUMN     "value" JSONB;
