-- Add tags to ScoreVersion
ALTER TABLE "ScoreVersion" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
