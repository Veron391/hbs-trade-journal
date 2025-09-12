/*
  Warnings:

  - Added the required column `entryDate` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exitDate` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "price" REAL NOT NULL,
    "pnl" REAL,
    "occurredAt" DATETIME NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "exitDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Trade" ("assetType", "createdAt", "id", "occurredAt", "pnl", "price", "qty", "side", "symbol", "updatedAt", "userId", "entryDate", "exitDate") SELECT "assetType", "createdAt", "id", "occurredAt", "pnl", "price", "qty", "side", "symbol", "updatedAt", "userId", "occurredAt", "occurredAt" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE INDEX "Trade_userId_occurredAt_idx" ON "Trade"("userId", "occurredAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
