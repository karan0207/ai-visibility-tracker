-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "promptCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mentionShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mentionsPerPrompt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstMentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "missedPrompts" INTEGER NOT NULL DEFAULT 0,
    "promptsWithBrand" INTEGER NOT NULL DEFAULT 0,
    "mentions" INTEGER NOT NULL DEFAULT 0,
    "firstMentions" INTEGER NOT NULL DEFAULT 0,
    "visibility" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "citationShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "analysisId" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptRun" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "brandsMentioned" TEXT[],
    "firstMention" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisId" TEXT NOT NULL,

    CONSTRAINT "PromptRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "context" TEXT,
    "position" INTEGER,
    "brandId" TEXT NOT NULL,
    "promptRunId" TEXT NOT NULL,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citation" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "analysisId" TEXT NOT NULL,

    CONSTRAINT "Citation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analysis_createdAt_idx" ON "Analysis"("createdAt");

-- CreateIndex
CREATE INDEX "Brand_analysisId_idx" ON "Brand"("analysisId");

-- CreateIndex
CREATE INDEX "PromptRun_analysisId_idx" ON "PromptRun"("analysisId");

-- CreateIndex
CREATE INDEX "Mention_brandId_idx" ON "Mention"("brandId");

-- CreateIndex
CREATE INDEX "Mention_promptRunId_idx" ON "Mention"("promptRunId");

-- CreateIndex
CREATE INDEX "Citation_analysisId_idx" ON "Citation"("analysisId");

-- CreateIndex
CREATE INDEX "Citation_domain_idx" ON "Citation"("domain");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptRun" ADD CONSTRAINT "PromptRun_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_promptRunId_fkey" FOREIGN KEY ("promptRunId") REFERENCES "PromptRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
