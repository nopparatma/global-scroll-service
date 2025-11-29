-- Rename country_history_raw to transaction_history_raw
ALTER TABLE "country_history_raw" RENAME TO "transaction_history_raw";

-- Rename country_history_daily to transaction_history_daily
ALTER TABLE "country_history_daily" RENAME TO "transaction_history_daily";
