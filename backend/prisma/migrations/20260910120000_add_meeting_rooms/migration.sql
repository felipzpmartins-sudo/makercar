-- CreateEnum
CREATE TYPE "MeetingRoomStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "MeetingRoomReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "meeting_rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "hero_image_url" TEXT,
    "status" "MeetingRoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 6,
    "amenities" JSONB,
    "notes" TEXT,
    "usage_rules" TEXT,
    "opening_time" TEXT NOT NULL DEFAULT '07:00',
    "closing_time" TEXT NOT NULL DEFAULT '19:00',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_room_reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "attendees" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "status" "MeetingRoomReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "cancellation_reason" TEXT,
    "cancelled_by_id" UUID,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_room_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_room_reservation_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_room_reservation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meeting_rooms_slug_key" ON "meeting_rooms"("slug");

-- CreateIndex
CREATE INDEX "meeting_rooms_active_sort_order_idx" ON "meeting_rooms"("active", "sort_order");

-- CreateIndex
CREATE INDEX "meeting_room_reservations_room_id_status_idx" ON "meeting_room_reservations"("room_id", "status");

-- CreateIndex
CREATE INDEX "meeting_room_reservations_user_id_status_idx" ON "meeting_room_reservations"("user_id", "status");

-- CreateIndex
CREATE INDEX "meeting_room_reservations_start_date_end_date_idx" ON "meeting_room_reservations"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "meeting_room_reservation_logs_reservation_id_idx" ON "meeting_room_reservation_logs"("reservation_id");

-- AddForeignKey
ALTER TABLE "meeting_room_reservations" ADD CONSTRAINT "meeting_room_reservations_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "meeting_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_room_reservations" ADD CONSTRAINT "meeting_room_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_room_reservations" ADD CONSTRAINT "meeting_room_reservations_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_room_reservation_logs" ADD CONSTRAINT "meeting_room_reservation_logs_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "meeting_room_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_room_reservation_logs" ADD CONSTRAINT "meeting_room_reservation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
