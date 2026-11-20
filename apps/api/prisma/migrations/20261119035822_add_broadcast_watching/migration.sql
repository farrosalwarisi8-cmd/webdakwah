-- CreateTable
CREATE TABLE "broadcast_watchings" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_watchings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "broadcast_watchings_profile_id_idx" ON "broadcast_watchings"("profile_id");

-- CreateIndex
CREATE INDEX "broadcast_watchings_channel_id_idx" ON "broadcast_watchings"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "broadcast_watchings_profile_id_channel_id_key" ON "broadcast_watchings"("profile_id", "channel_id");

-- AddForeignKey
ALTER TABLE "broadcast_watchings" ADD CONSTRAINT "broadcast_watchings_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_watchings" ADD CONSTRAINT "broadcast_watchings_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "live_stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;
