-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "country_code" TEXT NOT NULL DEFAULT 'XX',
    "username" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_history_raw" (
    "id" SERIAL NOT NULL,
    "height" BIGINT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_history_raw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_history_5min" (
    "id" SERIAL NOT NULL,
    "height" BIGINT NOT NULL,
    "min_height" BIGINT NOT NULL,
    "max_height" BIGINT NOT NULL,
    "sample_count" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_history_5min_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_history_hourly" (
    "id" SERIAL NOT NULL,
    "height" BIGINT NOT NULL,
    "min_height" BIGINT NOT NULL,
    "max_height" BIGINT NOT NULL,
    "sample_count" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_history_hourly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_history_daily" (
    "id" SERIAL NOT NULL,
    "height" BIGINT NOT NULL,
    "min_height" BIGINT NOT NULL,
    "max_height" BIGINT NOT NULL,
    "sample_count" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_history_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_device_id_key" ON "users"("device_id");

-- CreateIndex
CREATE INDEX "global_history_raw_recorded_at_idx" ON "global_history_raw"("recorded_at" DESC);

-- CreateIndex
CREATE INDEX "global_history_5min_recorded_at_idx" ON "global_history_5min"("recorded_at" DESC);

-- CreateIndex
CREATE INDEX "global_history_hourly_recorded_at_idx" ON "global_history_hourly"("recorded_at" DESC);

-- CreateIndex
CREATE INDEX "global_history_daily_recorded_at_idx" ON "global_history_daily"("recorded_at" DESC);
