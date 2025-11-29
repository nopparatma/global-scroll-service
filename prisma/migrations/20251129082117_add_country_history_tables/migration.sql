-- CreateTable
CREATE TABLE "country_history_raw" (
    "id" SERIAL NOT NULL,
    "country_code" TEXT NOT NULL,
    "height" BIGINT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "country_history_raw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_history_5min" (
    "id" SERIAL NOT NULL,
    "country_code" TEXT NOT NULL,
    "height" BIGINT NOT NULL,
    "min_height" BIGINT NOT NULL,
    "max_height" BIGINT NOT NULL,
    "sample_count" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_history_5min_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_history_hourly" (
    "id" SERIAL NOT NULL,
    "country_code" TEXT NOT NULL,
    "height" BIGINT NOT NULL,
    "min_height" BIGINT NOT NULL,
    "max_height" BIGINT NOT NULL,
    "sample_count" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_history_hourly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_history_daily" (
    "id" SERIAL NOT NULL,
    "country_code" TEXT NOT NULL,
    "height" BIGINT NOT NULL,
    "min_height" BIGINT NOT NULL,
    "max_height" BIGINT NOT NULL,
    "sample_count" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_history_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "country_history_raw_country_code_recorded_at_idx" ON "country_history_raw"("country_code", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "country_history_raw_recorded_at_idx" ON "country_history_raw"("recorded_at" DESC);

-- CreateIndex
CREATE INDEX "country_history_5min_country_code_recorded_at_idx" ON "country_history_5min"("country_code", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "country_history_5min_recorded_at_idx" ON "country_history_5min"("recorded_at" DESC);

-- CreateIndex
CREATE INDEX "country_history_hourly_country_code_recorded_at_idx" ON "country_history_hourly"("country_code", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "country_history_hourly_recorded_at_idx" ON "country_history_hourly"("recorded_at" DESC);

-- CreateIndex
CREATE INDEX "country_history_daily_country_code_recorded_at_idx" ON "country_history_daily"("country_code", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "country_history_daily_recorded_at_idx" ON "country_history_daily"("recorded_at" DESC);
