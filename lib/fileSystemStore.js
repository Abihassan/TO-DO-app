// ---------------------------------------------------------------------------
// Generic, adapter-based, atomic JSON file store.
//
// Design:
//   - The in-memory `cache` array/object is the source of truth while the
//     app runs. Every read (getSnapshot) is synchronous and comes straight
//     from memory — no disk I/O on the read path, ever.
//   - Every mutation updates `cache` immediately, notifies subscribers
//     (so React re-renders instantly), and *schedules* a debounced background
//     write. Rapid consecutive edits coalesce into a single disk write.
//   - Persisting a file never writes the real file directly. It writes a
//     `.tmp` file, then atomically swaps it into place — and keeps a `.bak`
//     copy of the last known-good file before swapping. This is what
//     protects against corruption from a crash/kill mid-write.
//   - Loading validates the parsed JSON with a caller-supplied validator
//     that can *sanitize* (drop just the bad records) rather than failing
//     the whole load. If the primary file is unreadable/invalid, the loader
//     falls back to `.bak`, then finally to `defaultValue` — while moving
//     the unreadable file aside instead of deleting it, so nothing is lost.
//
// The `adapter` parameter abstracts the actual filesystem calls, so this
// entire module is unit-testable in plain Node with an in-memory fake
// (see lib/__tests__/fileSystemStore.test.js) while the app uses the real
// expo-file-system-backed adapter (see lib/expoFileSystemAdapter.js).
// ---------------------------------------------------------------------------

const DEFAULT_DEBOUNCE_MS = 500;

function deepClone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

/**
 * @param {object} config
 * @param {string} config.name - entity name, used as the base filename (no extension)
 * @param {object} config.adapter - filesystem adapter, see expoFileSystemAdapter.js
 * @param {any} config.defaultValue - value used when no file exists yet, or all recovery fails
 * @param {(parsed: any) => { valid: boolean, sanitized: any, issues: string[] }} config.validate
 * @param {number} [config.debounceMs]
 * @param {(message: string, meta?: object) => void} [config.onWarning] - non-fatal issue reporter
 */
export function createFileStore({
  name,
  adapter,
  defaultValue,
  validate,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  onWarning = () => {},
}) {
  let cache = deepClone(defaultValue);
  let isLoaded = false;
  let writeTimer = null;
  let hasPendingWrite = false;
  let isWriting = false;
  let lastError = null;
  const listeners = new Set();

  function notify() {
    for (const listener of listeners) listener();
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getSnapshot() {
    return cache;
  }

  // Loads from disk into `cache`. Call once at boot, before rendering.
  async function load() {
    const fileName = `${name}.json`;
    const backupName = `${name}.json.bak`;

    await adapter.ensureDir();

    const exists = await adapter.exists(fileName);
    if (!exists) {
      cache = deepClone(defaultValue);
      isLoaded = true;
      await persistNow(); // create the file for the first time
      notify();
      return cache;
    }

    const primary = await tryReadAndValidate(fileName);
    if (primary.ok) {
      cache = primary.value;
      isLoaded = true;
      notify();
      return cache;
    }

    onWarning(`"${name}" data file failed validation, trying backup`, {
      issues: primary.issues,
    });

    const backupExists = await adapter.exists(backupName);
    if (backupExists) {
      const backup = await tryReadAndValidate(backupName);
      if (backup.ok) {
        cache = backup.value;
        isLoaded = true;
        // Restore the backup as primary so we're consistent going forward.
        await persistNow();
        notify();
        onWarning(`"${name}" recovered from backup`);
        return cache;
      }
    }

    // Both primary and backup are unusable. Preserve the corrupted file
    // for forensics instead of silently deleting it, then fall back clean.
    try {
      await adapter.quarantine(fileName, `${name}.corrupted-${Date.now()}.json`);
    } catch (e) {
      // Best effort — if we can't even quarantine it, proceed anyway.
    }
    onWarning(`"${name}" data unrecoverable, resetting to defaults`, {
      issues: primary.issues,
    });
    cache = deepClone(defaultValue);
    isLoaded = true;
    await persistNow();
    notify();
    return cache;
  }

  async function tryReadAndValidate(fileName) {
    try {
      const text = await adapter.readText(fileName);
      const parsed = JSON.parse(text);
      const result = validate(parsed);
      if (result.valid) {
        return { ok: true, value: result.sanitized };
      }
      if (result.sanitized !== null && result.sanitized !== undefined) {
        // Partially valid — salvage what we can (e.g. drop only bad records).
        onWarning(`"${name}" partially valid, salvaging usable records`, {
          issues: result.issues,
        });
        return { ok: true, value: result.sanitized };
      }
      return { ok: false, issues: result.issues };
    } catch (error) {
      return { ok: false, issues: [String(error && error.message ? error.message : error)] };
    }
  }

  function scheduleWrite() {
    hasPendingWrite = true;
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      writeTimer = null;
      persistNow();
    }, debounceMs);
  }

  // Performs the actual atomic write. Safe to call directly for a forced
  // flush (e.g. on app background/exit) or via the debounce timer.
  async function persistNow() {
    if (isWriting) {
      // A write is already in flight. Don't lose this request — the
      // in-flight write only has whatever `cache` looked like when it
      // started, so if `cache` has changed since, we still need another
      // pass once it's done. hasPendingWrite is already true here (every
      // caller of persistNow only runs after setting it), and the finally
      // block below reschedules automatically when it sees that.
      return;
    }
    isWriting = true;
    hasPendingWrite = false;
    const fileName = `${name}.json`;
    const backupName = `${name}.json.bak`;
    const tempName = `${name}.json.tmp`;
    const snapshotText = JSON.stringify(cache);
    try {
      // Keep last-known-good as backup before we touch the primary file.
      if (await adapter.exists(fileName)) {
        await adapter.copy(fileName, backupName);
      }
      await adapter.writeText(tempName, snapshotText);
      await adapter.moveOverwrite(tempName, fileName);
      lastError = null;
    } catch (error) {
      lastError = error;
      onWarning(`"${name}" failed to persist to disk`, { error: String(error) });
      hasPendingWrite = true; // retry below
    } finally {
      isWriting = false;
      if (hasPendingWrite) {
        // Either the write above failed, or a newer change arrived while it
        // was in flight (and collided with the isWriting guard above) — in
        // both cases, go again rather than waiting for some unrelated future
        // mutation to be the one that happens to trigger the retry.
        scheduleWrite();
      }
    }
  }

  async function flush() {
    if (writeTimer) {
      clearTimeout(writeTimer);
      writeTimer = null;
    }
    if (hasPendingWrite) {
      await persistNow();
    }
  }

  function setAll(next) {
    cache = next;
    notify();
    scheduleWrite();
  }

  function mutate(updater) {
    cache = updater(cache);
    notify();
    scheduleWrite();
  }

  return {
    load,
    flush,
    subscribe,
    getSnapshot,
    setAll,
    mutate,
    get isLoaded() {
      return isLoaded;
    },
    get lastError() {
      return lastError;
    },
  };
}
