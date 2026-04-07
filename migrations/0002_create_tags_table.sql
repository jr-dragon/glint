-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_object_tags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_object_tags_A_fkey" FOREIGN KEY ("A") REFERENCES "objects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_object_tags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_object_tags_AB_unique" ON "_object_tags"("A", "B");

-- CreateIndex
CREATE INDEX "_object_tags_B_index" ON "_object_tags"("B");
