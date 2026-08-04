import { Directory, File, Paths } from "expo-file-system";

// All app data lives under <documentDirectory>/data/ — Paths.document is
// the persistent, non-cache directory (survives backgrounding and is not
// purged by the OS under storage pressure, unlike Paths.cache).
const DATA_DIR_NAME = "data";

function getDataDirectory() {
  return new Directory(Paths.document, DATA_DIR_NAME);
}

/**
 * Real filesystem adapter for createFileStore(), backed by expo-file-system's
 * class-based File/Directory API (stable since SDK 54; the old function-based
 * FileSystem.writeAsStringAsync-style API is deprecated and now lives under
 * expo-file-system/legacy).
 */
export function createExpoFileSystemAdapter() {
  const dir = getDataDirectory();

  return {
    async ensureDir() {
      if (!dir.exists) {
        dir.create({ intermediates: true, idempotent: true });
      }
    },

    async exists(fileName) {
      return new File(dir, fileName).exists;
    },

    async readText(fileName) {
      return new File(dir, fileName).text();
    },

    async writeText(fileName, text) {
      const file = new File(dir, fileName);
      if (!file.exists) {
        file.create({ overwrite: true });
      }
      file.write(text);
    },

    // Atomically replace `destName` with the contents currently at `srcName`.
    async moveOverwrite(srcName, destName) {
      const src = new File(dir, srcName);
      const dest = new File(dir, destName);
      await src.move(dest, { overwrite: true });
    },

    async copy(srcName, destName) {
      const src = new File(dir, srcName);
      const dest = new File(dir, destName);
      await src.copy(dest, { overwrite: true });
    },

    // Moves an unreadable file aside for forensics instead of deleting it.
    async quarantine(fileName, quarantineName) {
      const src = new File(dir, fileName);
      if (!src.exists) return;
      const dest = new File(dir, quarantineName);
      await src.move(dest, { overwrite: true });
    },
  };
}
