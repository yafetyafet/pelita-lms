-- =====================================================================
-- PERUBAHAN SKEMA — HANYA UNTUK DITINJAU
-- =====================================================================
-- Dihasilkan dengan:
--   npx prisma migrate diff --     --from-schema-datasource prisma/schema.prisma --     --to-schema-datamodel  prisma/schema.prisma --script
--
-- Inilah SQL yang akan dijalankan `npx prisma db push`. Anda TIDAK perlu
-- menjalankan berkas ini secara manual — cukup untuk diperiksa sebelum
-- menyetujui `db push`.
--
-- Sifat perubahan: murni penambahan. Tidak ada DROP TABLE, DROP COLUMN,
-- TRUNCATE, maupun DELETE. Satu-satunya pelonggaran adalah
-- ExamSubmission."submittedAt" yang menjadi nullable (sebelumnya wajib
-- berisi), supaya pengerjaan yang masih berlangsung bisa disimpan.
--
-- Menambah 5 tabel: BroadcastRead, Partner, PklPlacement, PklJournal,
-- PklAttendance.
-- =====================================================================

-- AlterTable
ALTER TABLE "AppSetting" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "allowLateSubmission" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxScore" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "dateKey" TEXT NOT NULL,
ADD COLUMN     "distance" DOUBLE PRECISION,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'DAILY',
ADD COLUMN     "note" TEXT,
ADD COLUMN     "recordedById" TEXT,
ADD COLUMN     "slotKey" TEXT NOT NULL,
ADD COLUMN     "subjectId" TEXT;

-- AlterTable
ALTER TABLE "Broadcast" ADD COLUMN     "authorId" TEXT;

-- AlterTable
ALTER TABLE "ClassStudent" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "description" TEXT,
ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passingScore" INTEGER,
ADD COLUMN     "showResult" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shuffle" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "startAt" TIMESTAMP(3),
ADD COLUMN     "token" TEXT;

-- AlterTable
ALTER TABLE "ExamQuestion" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ExamSubmission" ADD COLUMN     "essayMax" DOUBLE PRECISION,
ADD COLUMN     "essayScore" DOUBLE PRECISION,
ADD COLUMN     "finalScore" DOUBLE PRECISION,
ADD COLUMN     "gradedAt" TIMESTAMP(3),
ADD COLUMN     "gradedById" TEXT,
ADD COLUMN     "scoreMax" DOUBLE PRECISION,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ONGOING',
ADD COLUMN     "violationCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "submittedAt" DROP NOT NULL,
ALTER COLUMN "submittedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ForumDiscussion" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "hadir" INTEGER,
ADD COLUMN     "jamKe" TEXT,
ADD COLUMN     "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "LibraryBook" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "isbn" TEXT,
ADD COLUMN     "publisher" TEXT,
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'LINK';

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nomorInduk" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "UserAssignment" ADD COLUMN     "answerText" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "gradedAt" TIMESTAMP(3),
ADD COLUMN     "gradedById" TEXT,
ADD COLUMN     "isLate" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Violation" ADD COLUMN     "category" TEXT,
ADD COLUMN     "followUp" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "BroadcastRead" (
    "broadcastId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BroadcastRead_pkey" PRIMARY KEY ("broadcastId","userId")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contact" TEXT,
    "phone" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "radius" INTEGER NOT NULL DEFAULT 150,
    "mentorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PklPlacement" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "supervisorId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "finalNote" TEXT,
    "finalScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PklPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PklJournal" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "activity" TEXT NOT NULL,
    "notes" TEXT,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "mentorNote" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PklJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PklAttendance" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "distance" DOUBLE PRECISION,
    "checkOutTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PklAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BroadcastRead_userId_idx" ON "BroadcastRead"("userId");

-- CreateIndex
CREATE INDEX "Partner_mentorId_idx" ON "Partner"("mentorId");

-- CreateIndex
CREATE INDEX "PklPlacement_partnerId_status_idx" ON "PklPlacement"("partnerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PklPlacement_studentId_partnerId_startDate_key" ON "PklPlacement"("studentId", "partnerId", "startDate");

-- CreateIndex
CREATE INDEX "PklJournal_placementId_date_idx" ON "PklJournal"("placementId", "date");

-- CreateIndex
CREATE INDEX "PklAttendance_placementId_date_idx" ON "PklAttendance"("placementId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PklAttendance_placementId_dateKey_key" ON "PklAttendance"("placementId", "dateKey");

-- CreateIndex
CREATE INDEX "Assignment_classId_subjectId_idx" ON "Assignment"("classId", "subjectId");

-- CreateIndex
CREATE INDEX "Assignment_authorId_idx" ON "Assignment"("authorId");

-- CreateIndex
CREATE INDEX "Attendance_classId_dateKey_idx" ON "Attendance"("classId", "dateKey");

-- CreateIndex
CREATE INDEX "Attendance_userId_date_idx" ON "Attendance"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_userId_slotKey_key" ON "Attendance"("userId", "slotKey");

-- CreateIndex
CREATE INDEX "Broadcast_createdAt_idx" ON "Broadcast"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Class_name_key" ON "Class"("name");

-- CreateIndex
CREATE INDEX "Class_level_idx" ON "Class"("level");

-- CreateIndex
CREATE INDEX "ClassStudent_classId_idx" ON "ClassStudent"("classId");

-- CreateIndex
CREATE INDEX "ClassTeacher_classId_idx" ON "ClassTeacher"("classId");

-- CreateIndex
CREATE INDEX "ClassTeacher_subjectId_idx" ON "ClassTeacher"("subjectId");

-- CreateIndex
CREATE INDEX "Exam_classId_isPublished_idx" ON "Exam"("classId", "isPublished");

-- CreateIndex
CREATE INDEX "Exam_authorId_idx" ON "Exam"("authorId");

-- CreateIndex
CREATE INDEX "ExamQuestion_examId_order_idx" ON "ExamQuestion"("examId", "order");

-- CreateIndex
CREATE INDEX "ExamSubmission_examId_status_idx" ON "ExamSubmission"("examId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSubmission_examId_userId_key" ON "ExamSubmission"("examId", "userId");

-- CreateIndex
CREATE INDEX "ForumDiscussion_classId_createdAt_idx" ON "ForumDiscussion"("classId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumDiscussion_createdAt_idx" ON "ForumDiscussion"("createdAt");

-- CreateIndex
CREATE INDEX "ForumReply_discussionId_createdAt_idx" ON "ForumReply"("discussionId", "createdAt");

-- CreateIndex
CREATE INDEX "Journal_authorId_createdAt_idx" ON "Journal"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Journal_classId_subjectId_idx" ON "Journal"("classId", "subjectId");

-- CreateIndex
CREATE INDEX "LibraryBook_category_idx" ON "LibraryBook"("category");

-- CreateIndex
CREATE INDEX "Material_classId_createdAt_idx" ON "Material"("classId", "createdAt");

-- CreateIndex
CREATE INDEX "Material_authorId_idx" ON "Material"("authorId");

-- CreateIndex
CREATE INDEX "Schedule_classId_day_idx" ON "Schedule"("classId", "day");

-- CreateIndex
CREATE INDEX "Schedule_teacherId_day_idx" ON "Schedule"("teacherId", "day");

-- CreateIndex
CREATE INDEX "Session_day_startTime_idx" ON "Session"("day", "startTime");

-- CreateIndex
CREATE INDEX "SpiritualJournal_userId_createdAt_idx" ON "SpiritualJournal"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE INDEX "UserAssignment_assignmentId_status_idx" ON "UserAssignment"("assignmentId", "status");

-- CreateIndex
CREATE INDEX "Violation_studentId_createdAt_idx" ON "Violation"("studentId", "createdAt");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssignment" ADD CONSTRAINT "UserAssignment_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubmission" ADD CONSTRAINT "ExamSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubmission" ADD CONSTRAINT "ExamSubmission_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broadcast" ADD CONSTRAINT "Broadcast_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastRead" ADD CONSTRAINT "BroadcastRead_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastRead" ADD CONSTRAINT "BroadcastRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryBook" ADD CONSTRAINT "LibraryBook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PklPlacement" ADD CONSTRAINT "PklPlacement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PklPlacement" ADD CONSTRAINT "PklPlacement_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PklPlacement" ADD CONSTRAINT "PklPlacement_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PklJournal" ADD CONSTRAINT "PklJournal_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "PklPlacement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PklJournal" ADD CONSTRAINT "PklJournal_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PklAttendance" ADD CONSTRAINT "PklAttendance_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "PklPlacement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

