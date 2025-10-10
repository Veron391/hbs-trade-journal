/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `entryDate` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `entryPrice` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `exitDate` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `mistakesNotes` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `setupNotes` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Trade` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_username_key";

-- DropIndex
DROP INDEX "User_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Trade" ("assetType", "createdAt", "id", "occurredAt", "pnl", "price", "qty", "side", "symbol", "updatedAt", "userId") SELECT "assetType", "createdAt", "id", "occurredAt", "pnl", "price", "qty", "side", "symbol", "updatedAt", "userId" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE INDEX "Trade_userId_occurredAt_idx" ON "Trade"("userId", "occurredAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
