/**
 * Postman Collection Merger (ES6 Module)
 *
 * Script untuk menggabungkan file-file JSON API terpisah dengan urutan manual.
 *
 * Usage:
 *   node tools/merge-collection.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi
const CONFIG = {
  baseDir: path.join(__dirname, "..", "source", "apis"),
  outputFile: path.join(
    __dirname,
    "..",
    "artifacts",
    "API Testing Collection CMS.postman_collection.json",
  ),
  collectionInfo: {
    _postman_id: "cf938ee0-fff4-4056-a49d-b1f0d3eed3af",
    name: "API Testing Collection CMS ",
    description: "Collection untuk testing API - dimulai dari Auth endpoints",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    _exporter_id: "39206356",
  },
  // Daftar file yang akan di-merge (urutan sesuai array)
  filePaths: [
    "auth/register/register.json",
    "auth/login/login.json",
    "apikey/apikey.json",
    "projects/projects.json",
    "tables/tables.json",
    "columns/columns.json",
    "rows/rows.json",
    "cells/cells.json",
  ],
};

/**
 * Membaca file JSON dari file path yang ditentukan
 */
function readJsonFile(relativePath) {
  const fullPath = path.join(CONFIG.baseDir, relativePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File tidak ditemukan: ${relativePath}`);
  }

  const content = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  return {
    path: relativePath,
    content,
  };
}

/**
 * Mengorganisir file berdasarkan struktur folder (manual input)
 */
function organizeFilesByStructure(filePaths) {
  const structure = {};

  filePaths.forEach((relativePath) => {
    const parts = relativePath.split("/");

    // parts[0] = module (e.g., "auth")
    // parts[1] = subfolder (e.g., "register", "login")

    if (parts.length < 2) {
      console.warn(`⚠️  File diabaikan: ${relativePath}`);
      return;
    }

    const module = parts[0];
    const subfolder = parts[1];

    if (!structure[module]) {
      structure[module] = {};
    }

    if (!structure[module][subfolder]) {
      structure[module][subfolder] = [];
    }

    try {
      const fileData = readJsonFile(relativePath);
      structure[module][subfolder].push(fileData);
    } catch (error) {
      console.error(`❌ Error: ${relativePath} - ${error.message}`);
    }
  });

  return structure;
}

/**
 * Mengubah string menjadi Title Case
 */
function toTitleCase(str) {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Membangun collection dengan mempertahankan urutan input
 */
function buildCollection(structure, originalOrder) {
  const items = [];
  const processedModules = new Set();

  // Proses sesuai urutan original
  originalOrder.forEach((filePath) => {
    const parts = filePath.split("/");
    const module = parts[0];

    // Skip jika module sudah diproses
    if (processedModules.has(module)) return;
    processedModules.add(module);

    if (!structure[module]) return;

    const moduleItem = {
      name: toTitleCase(module),
      item: [],
    };

    // Proses subfolder sesuai urutan kemunculan di originalOrder
    const subfolderOrder = [];
    originalOrder.forEach((fp) => {
      const p = fp.split("/");
      if (p[0] === module && p[1] && !subfolderOrder.includes(p[1])) {
        subfolderOrder.push(p[1]);
      }
    });

    subfolderOrder.forEach((subfolder) => {
      if (!structure[module][subfolder]) return;

      const subfolderItem = {
        name: toTitleCase(subfolder),
        item: [],
      };

      structure[module][subfolder].forEach((file) => {
        if (Array.isArray(file.content)) {
          subfolderItem.item.push(...file.content);
        } else if (typeof file.content === "object") {
          subfolderItem.item.push(file.content);
        }
      });

      moduleItem.item.push(subfolderItem);
    });

    items.push(moduleItem);
  });

  return items;
}

/**
 * Main function
 */
function main() {
  console.log("🚀 Postman Collection Merger\n");

  // Validasi file paths
  if (!CONFIG.filePaths || CONFIG.filePaths.length === 0) {
    console.error("❌ Tidak ada file path di konfigurasi");
    process.exit(1);
  }

  console.log(`📋 Menggabungkan ${CONFIG.filePaths.length} file...`);

  // Organisir file berdasarkan struktur
  const structure = organizeFilesByStructure(CONFIG.filePaths);

  // Build collection dengan urutan sesuai input
  const items = buildCollection(structure, CONFIG.filePaths);

  // Buat collection final
  const collection = {
    info: CONFIG.collectionInfo,
    item: items,
  };

  // Hitung total requests
  let totalRequests = 0;
  function countRequests(items) {
    items.forEach((item) => {
      if (item.request) totalRequests++;
      if (item.item && Array.isArray(item.item)) countRequests(item.item);
    });
  }
  countRequests(items);

  console.log(`✅ ${totalRequests} requests berhasil digabung\n`);

  // Simpan ke file
  try {
    fs.writeFileSync(
      CONFIG.outputFile,
      JSON.stringify(collection, null, 2),
      "utf8",
    );

    const stats = fs.statSync(CONFIG.outputFile);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);

    console.log(
      `💾 File disimpan: ${path.basename(CONFIG.outputFile)} (${fileSizeInKB} KB)`,
    );
    console.log("🎉 Selesai!\n");
  } catch (error) {
    console.error("❌ Error menyimpan file:", error.message);
    process.exit(1);
  }
}

// Jalankan script
main();

export { buildCollection, organizeFilesByStructure };
