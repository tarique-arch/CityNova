-- ==============================================================================
-- CityNova Database Schema for Turso (libSQL)
-- Ordered correctly by Foreign Key dependencies: City -> User -> Ticket -> Rest
-- ==============================================================================

-- 1. City (Parent table with NO foreign keys)
CREATE TABLE IF NOT EXISTS "City" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "normalizedKey" TEXT NOT NULL,
    "centerLat" REAL NOT NULL,
    "centerLng" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. User (References City)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "username" TEXT,
    "employeeId" TEXT,
    "phoneHash" TEXT,
    "aadhaarHash" TEXT,
    "state" TEXT,
    "cityId" TEXT,
    "email" TEXT,
    "designation" TEXT,
    "dob" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "coverUrl" TEXT,
    "civicScore" INTEGER NOT NULL DEFAULT 50,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "bannedAt" DATETIME,
    "bannedBy" TEXT,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "starredReason" TEXT,
    "starredAt" DATETIME,
    "starredBy" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CITIZEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 3. Session (References User)
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Ticket (References City and User)
CREATE TABLE IF NOT EXISTS "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'MEDIUM',
    "plainLanguageRights" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "addressDescription" TEXT NOT NULL,
    "cityId" TEXT,
    "reporterId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenPhone" TEXT NOT NULL,
    "publicCommitmentDate" DATETIME NOT NULL,
    "slaDeadline" DATETIME NOT NULL,
    "initialPhotoUrl" TEXT,
    "initialAudioUrl" TEXT,
    "resolutionPhotoUrl" TEXT,
    "resolutionGpsLat" REAL,
    "resolutionGpsLng" REAL,
    "resolutionTimestamp" DATETIME,
    "resolutionNotes" TEXT,
    "disputeReason" TEXT,
    "disputePhotoUrl" TEXT,
    "hadDispute" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ticket_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. TicketReaction (References Ticket and User)
CREATE TABLE IF NOT EXISTS "TicketReaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketReaction_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicketReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. TicketComment (References Ticket and User)
CREATE TABLE IF NOT EXISTS "TicketComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicketComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 7. TicketStatusHistory (References Ticket and User)
CREATE TABLE IF NOT EXISTS "TicketStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketStatusHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicketStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indices
CREATE UNIQUE INDEX IF NOT EXISTS "City_normalizedKey_key" ON "City"("normalizedKey");
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_employeeId_key" ON "User"("employeeId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_aadhaarHash_key" ON "User"("aadhaarHash");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_caseId_key" ON "Ticket"("caseId");
CREATE INDEX IF NOT EXISTS "TicketReaction_ticketId_idx" ON "TicketReaction"("ticketId");
CREATE UNIQUE INDEX IF NOT EXISTS "TicketReaction_ticketId_userId_key" ON "TicketReaction"("ticketId", "userId");
CREATE INDEX IF NOT EXISTS "TicketComment_ticketId_createdAt_idx" ON "TicketComment"("ticketId", "createdAt");
CREATE INDEX IF NOT EXISTS "TicketStatusHistory_ticketId_createdAt_idx" ON "TicketStatusHistory"("ticketId", "createdAt");

-- Seed Initial City: Ponda, Goa
INSERT OR IGNORE INTO "City" ("id", "name", "state", "normalizedKey", "centerLat", "centerLng", "createdAt")
VALUES ('city_ponda_goa', 'Ponda', 'Goa', 'ponda,goa,india', 15.4026, 74.0151, CURRENT_TIMESTAMP);
