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
    "exitPrice" REAL,
    "pnl" REAL,
    "entryDate" DATETIME NOT NULL,
    "exitDate" DATETIME NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Trade" ("assetType", "createdAt", "entryDate", "exitDate", "exitPrice", "id", "occurredAt", "pnl", "price", "qty", "side", "symbol", "updatedAt", "userId") SELECT "assetType", "createdAt", "entryDate", "exitDate", "exitPrice", "id", "occurredAt", "pnl", "price", "qty", "side", "symbol", "updatedAt", "userId" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE INDEX "Trade_userId_entryDate_idx" ON "Trade"("userId", "entryDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
