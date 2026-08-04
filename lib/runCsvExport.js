import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { toCsv } from "./csvExport";

/**
 * Writes `rows`/`columns` as CSV to a temp file in the cache directory
 * (export artifacts are ephemeral, unlike app data — Paths.cache is the
 * right directory for them) and opens the native share sheet so the user
 * can save it, AirDrop it, email it, etc.
 */
export async function exportRowsAsCsv(rows, columns, filenameBase) {
  const csvText = toCsv(rows, columns);
  const file = new File(Paths.cache, `${filenameBase}-${Date.now()}.csv`);

  file.create({ overwrite: true, intermediates: true });
  file.write(csvText);

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Sharing is not available on this device.");
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: `Export ${filenameBase}`,
    UTI: "public.comma-separated-values-text",
  });
}
