/**
 * Bruno Collection Merger (ES6 Module)
 *
 * Script untuk menggabungkan file-file JSON API terpisah dengan urutan yang rapi.
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
    "API Testing Collection CMS.json",
  ),
  collectionInfo: {
    _id: "cf938ee0-fff4-4056-a49d-b1f0d3eed3af",
    name: "API Testing Collection CMS (Bruno)",
    description: "Bruno collection untuk testing API Portfolio CMS",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    version: "1.0.0",
  },
  // Daftar file yang akan di-merge (urutan eksekusi logis pengujian)
  filePaths: [
    "auth/register/register.json",
    "auth/login/login.json",
    "auth/profile/profile.json",
    "auth/refresh-token/refresh-token.json",
    "auth/sessions/sessions.json",
    "auth/establish-session/establish-session.json",
    "auth/logout/logout.json",
    "auth/logout-all/logout-all.json",
    "apikey/apikey.json",
    "projects/projects.json",
    "tables/tables.json",
    "columns/columns.json",
    "rows/rows.json",
    "cells/cells.json",
    "public/public.json",
    "diagnostic/diagnostic.json",
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
 * Mengubah string menjadi Title Case
 */
function toTitleCase(str) {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Mengorganisir file berdasarkan struktur folder modular
 */
function organizeFilesByStructure(filePaths) {
  const structure = {};

  filePaths.forEach((relativePath) => {
    const parts = relativePath.split("/");

    if (parts.length < 2) {
      console.warn(`⚠️  File diabaikan: ${relativePath}`);
      return;
    }

    const module = parts[0];

    if (!structure[module]) {
      structure[module] = {
        _directItems: [],
        _subfolders: {},
      };
    }

    try {
      const fileData = readJsonFile(relativePath);

      if (parts.length === 2) {
        // Direct file under module, e.g. apikey/apikey.json
        structure[module]._directItems.push(fileData);
      } else if (parts.length >= 3) {
        // Subfolder under module, e.g. auth/login/login.json
        const subfolder = parts[1];
        if (!structure[module]._subfolders[subfolder]) {
          structure[module]._subfolders[subfolder] = [];
        }
        structure[module]._subfolders[subfolder].push(fileData);
      }
    } catch (error) {
      console.error(`❌ Error: ${relativePath} - ${error.message}`);
    }
  });

  return structure;
}

/**
 * Membangun collection dengan mempertahankan urutan input
 */
function buildCollection(structure, originalOrder) {
  const items = [];
  const processedModules = new Set();

  originalOrder.forEach((filePath) => {
    const parts = filePath.split("/");
    const module = parts[0];

    if (processedModules.has(module)) return;
    processedModules.add(module);

    if (!structure[module]) return;

    const moduleItem = {
      name: toTitleCase(module),
      item: [],
    };

    // 1. Tambahkan item langsung jika ada
    if (structure[module]._directItems && structure[module]._directItems.length > 0) {
      structure[module]._directItems.forEach((file) => {
        if (Array.isArray(file.content)) {
          moduleItem.item.push(...file.content);
        } else if (typeof file.content === "object") {
          moduleItem.item.push(file.content);
        }
      });
    }

    // 2. Tambahkan subfolder sesuai urutan
    const subfolderOrder = [];
    originalOrder.forEach((fp) => {
      const p = fp.split("/");
      if (p[0] === module && p[1] && p.length >= 3 && !subfolderOrder.includes(p[1])) {
        subfolderOrder.push(p[1]);
      }
    });

    subfolderOrder.forEach((subfolder) => {
      if (!structure[module]._subfolders[subfolder]) return;

      const subfolderItem = {
        name: toTitleCase(subfolder),
        item: [],
      };

      structure[module]._subfolders[subfolder].forEach((file) => {
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
  console.log("🚀 Bruno Collection Merger\n");

  if (!CONFIG.filePaths || CONFIG.filePaths.length === 0) {
    console.error("❌ Tidak ada file path di konfigurasi");
    process.exit(1);
  }

  console.log(`📋 Menggabungkan ${CONFIG.filePaths.length} file...`);

  const structure = organizeFilesByStructure(CONFIG.filePaths);
  const items = buildCollection(structure, CONFIG.filePaths);

  const collection = {
    info: CONFIG.collectionInfo,
    item: items,
  };

  let totalRequests = 0;
  function countRequests(itemList) {
    itemList.forEach((item) => {
      if (item.request) totalRequests++;
      if (item.item && Array.isArray(item.item)) countRequests(item.item);
    });
  }
  countRequests(items);

  console.log(`✅ ${totalRequests} requests berhasil digabung\n`);

  try {
    const artifactDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }

    fs.writeFileSync(
      CONFIG.outputFile,
      JSON.stringify(collection, null, 2),
      "utf8",
    );

    // Salin juga ke format kompatibel jika diperlukan
    const legacyOutputFile = path.join(
      artifactDir,
      "API Testing Collection CMS.postman_collection.json"
    );
    fs.writeFileSync(
      legacyOutputFile,
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

main();

export { buildCollection, organizeFilesByStructure };
