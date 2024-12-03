import Papa from "papaparse";

export interface CSVParseOptions {
  header?: boolean;
  skipEmptyLines?: boolean;
  transformHeader?: (header: string) => string;
}

export async function parseCSV<T = any>(
  file: File,
  options: CSVParseOptions = {}
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: options.header ?? true,
      skipEmptyLines: options.skipEmptyLines ?? true,
      transformHeader: options.transformHeader ?? normalizeHeader,
      complete: (results) => {
        if (results.errors.length) {
          console.error("CSV Parsing Errors:", results.errors);
          reject(new Error("Failed to parse CSV"));
        } else {
          // Validate and clean data
          const cleanedData = results.data.map(cleanCSVRow);
          resolve(cleanedData as T[]);
        }
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        reject(error);
      },
    });
  });
}

// Normalize header names to snake_case or camelCase
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// Clean and validate individual CSV rows
function cleanCSVRow(row: any): any {
  const cleanedRow: any = {};

  // Remove any undefined or null values
  Object.keys(row).forEach((key) => {
    const value = row[key];

    // Trim string values
    if (typeof value === "string") {
      const trimmedValue = value.trim();

      // Skip empty strings
      if (trimmedValue !== "") {
        cleanedRow[key] = trimmedValue;
      }
    }
    // Keep non-string values as is
    else if (value !== undefined && value !== null) {
      cleanedRow[key] = value;
    }
  });

  return cleanedRow;
}

// Utility to validate CSV structure
export function validateCSVStructure<T>(
  data: any[],
  requiredFields: (keyof T)[]
): boolean {
  if (data.length === 0) return false;

  return requiredFields.every((field) =>
    data[0].hasOwnProperty(field as string)
  );
}

// Example usage for message import
export function prepareMessageImport(csvData: any[]) {
  return csvData.map((row) => ({
    customerId: row.customer_id || generateUniqueId(),
    text: row.message || row.text,
    timestamp: Date.now(),
    status: "pending",
    priority: determinePriority(row.message || row.text),
  }));
}

// Helper functions
function generateUniqueId(): string {
  return `cust_${Math.random().toString(36).substr(2, 9)}`;
}

function determinePriority(text: string): "low" | "medium" | "high" {
  if (!text) return "low";

  const urgentKeywords = ["urgent", "emergency", "critical", "asap"];
  const lowercaseText = text.toLowerCase();

  if (urgentKeywords.some((keyword) => lowercaseText.includes(keyword))) {
    return "high";
  }

  return text.length > 200 ? "medium" : "low";
}
