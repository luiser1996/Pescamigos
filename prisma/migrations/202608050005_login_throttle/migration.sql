CREATE TABLE "LoginThrottle" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LoginThrottle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LoginThrottle_scope_keyHash_key" ON "LoginThrottle"("scope", "keyHash");
CREATE INDEX "LoginThrottle_resetAt_idx" ON "LoginThrottle"("resetAt");
