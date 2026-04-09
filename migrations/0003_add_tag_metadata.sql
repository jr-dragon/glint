-- AlterTable: add nullable metadata column to tags
ALTER TABLE "tags" ADD COLUMN "metadata" TEXT;
