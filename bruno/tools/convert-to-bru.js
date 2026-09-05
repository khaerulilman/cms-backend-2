/**
 * Bruno .bru Native File Generator (ES6 Module)
 *
 * Mengonversi seluruh JSON API test dari source/apis/ menjadi file-file .bru native Bruno
 * sehingga collection bisa langsung dibuka di aplikasi Bruno via "Open Collection".
 *
 * Usage:
 *   node tools/convert-to-bru.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BRUNO_ROOT = path.join(__dirname, "..");
const SOURCE_DIR = path.join(BRUNO_ROOT, "source", "apis");

// Urutan modul dan subfolder
const MODULE_CONFIG = [
  {
    folderName: "01-Auth",
    submodules: [
      { subfolder: "01-Register", jsonPath: "auth/register/register.json" },
      { subfolder: "02-Login", jsonPath: "auth/login/login.json" },
      { subfolder: "03-Profile", jsonPath: "auth/profile/profile.json" },
      { subfolder: "04-Refresh-Token", jsonPath: "auth/refresh-token/refresh-token.json" },
      { subfolder: "05-Sessions", jsonPath: "auth/sessions/sessions.json" },
      { subfolder: "06-Establish-Session", jsonPath: "auth/establish-session/establish-session.json" },
      { subfolder: "07-Logout", jsonPath: "auth/logout/logout.json" },
      { subfolder: "08-Logout-All", jsonPath: "auth/logout-all/logout-all.json" },
    ],
  },
  {
    folderName: "02-ApiKey",
    jsonPath: "apikey/apikey.json",
  },
  {
    folderName: "03-Projects",
    jsonPath: "projects/projects.json",
  },
  {
    folderName: "04-Tables",
    jsonPath: "tables/tables.json",
  },
  {
    folderName: "05-Columns",
    jsonPath: "columns/columns.json",
  },
  {
    folderName: "06-Rows",
    jsonPath: "rows/rows.json",
  },
  {
    folderName: "07-Cells",
    jsonPath: "cells/cells.json",
  },
  {
    folderName: "08-Public",
    jsonPath: "public/public.json",
  },
  {
    folderName: "09-Diagnostic",
    jsonPath: "diagnostic/diagnostic.json",
  },
];

/**
 * Membersihkan nama file dari karakter terlarang di Windows
 */
function sanitizeFileName(name) {
  return name.replace(/[/\\?%*:|"<>]/g, "-").trim();
}

/**
 * Mengonversi request object JSON menjadi string format .bru
 */
function convertItemToBru(item, seqNumber) {
  const name = item.name || "Untitled Request";
  const req = item.request || {};
  const method = (req.method || "GET").toLowerCase();
  
  let url = "";
  if (req.url) {
    url = typeof req.url === "string" ? req.url : req.url.raw || "";
  }

  // Tentukan body type
  let bodyType = "none";
  let bodyContent = "";
  if (req.body && req.body.raw && req.body.raw.trim().length > 0) {
    bodyType = "json";
    bodyContent = req.body.raw;
  }

  let bruContent = `meta {\n  name: ${name}\n  type: http\n  seq: ${seqNumber}\n}\n\n`;

  bruContent += `${method} {\n  url: ${url}\n  body: ${bodyType}\n  auth: none\n}\n\n`;

  // Headers
  const headers = req.header || [];
  const activeHeaders = headers.filter((h) => h.key && !h.disabled);
  if (activeHeaders.length > 0) {
    bruContent += `headers {\n`;
    activeHeaders.forEach((h) => {
      bruContent += `  ${h.key}: ${h.value}\n`;
    });
    bruContent += `}\n\n`;
  }

  // Body JSON
  if (bodyType === "json" && bodyContent) {
    bruContent += `body:json {\n${bodyContent
      .split("\n")
      .map((line) => "  " + line)
      .join("\n")}\n}\n\n`;
  }

  // Scripts & Tests
  const events = item.event || [];
  const prerequestEvent = events.find((e) => e.listen === "prerequest");
  const testEvent = events.find((e) => e.listen === "test");

  if (prerequestEvent && prerequestEvent.script && prerequestEvent.script.exec) {
    const execLines = Array.isArray(prerequestEvent.script.exec)
      ? prerequestEvent.script.exec
      : [prerequestEvent.script.exec];
    const scriptCode = execLines.join("\n").trim();
    if (scriptCode.length > 0) {
      bruContent += `script:pre-request {\n${scriptCode
        .split("\n")
        .map((line) => "  " + line)
        .join("\n")}\n}\n\n`;
    }
  }

  if (testEvent && testEvent.script && testEvent.script.exec) {
    const execLines = Array.isArray(testEvent.script.exec)
      ? testEvent.script.exec
      : [testEvent.script.exec];
    const testCode = execLines.join("\n").trim();
    if (testCode.length > 0) {
      bruContent += `tests {\n${testCode
        .split("\n")
        .map((line) => "  " + line)
        .join("\n")}\n}\n`;
    }
  }

  return bruContent;
}

function cleanTargetDir(dir) {
  if (fs.existsSync(dir)) {
    const existing = fs.readdirSync(dir);
    existing.forEach((file) => {
      if (file.endsWith(".bru")) {
        fs.unlinkSync(path.join(dir, file));
      }
    });
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Memproses dan menulis file .bru
 */
function processModule(mod) {
  let count = 0;

  if (mod.submodules) {
    const parentDir = path.join(BRUNO_ROOT, mod.folderName);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    mod.submodules.forEach((sub, subIdx) => {
      const targetDir = path.join(parentDir, sub.subfolder);
      cleanTargetDir(targetDir);

      const jsonFullPath = path.join(SOURCE_DIR, sub.jsonPath);
      if (fs.existsSync(jsonFullPath)) {
        const items = JSON.parse(fs.readFileSync(jsonFullPath, "utf8"));
        items.forEach((item, itemIdx) => {
          const seq = itemIdx + 1;
          const fileName = `${String(seq).padStart(2, "0")}-${sanitizeFileName(item.name)}.bru`;
          const filePath = path.join(targetDir, fileName);
          const content = convertItemToBru(item, seq);
          fs.writeFileSync(filePath, content, "utf8");
          count++;
        });
      }
    });
  } else if (mod.jsonPath) {
    const targetDir = path.join(BRUNO_ROOT, mod.folderName);
    cleanTargetDir(targetDir);

    const jsonFullPath = path.join(SOURCE_DIR, mod.jsonPath);
    if (fs.existsSync(jsonFullPath)) {
      const items = JSON.parse(fs.readFileSync(jsonFullPath, "utf8"));
      items.forEach((item, itemIdx) => {
        const seq = itemIdx + 1;
        const fileName = `${String(seq).padStart(2, "0")}-${sanitizeFileName(item.name)}.bru`;
        const filePath = path.join(targetDir, fileName);
        const content = convertItemToBru(item, seq);
        fs.writeFileSync(filePath, content, "utf8");
        count++;
      });
    }
  }

  return count;
}

function main() {
  console.log("⚡ Mengonversi JSON API tests ke file .bru native Bruno...\n");

  let totalBruFiles = 0;
  MODULE_CONFIG.forEach((mod) => {
    const count = processModule(mod);
    console.log(`📁 ${mod.folderName}: ${count} file .bru dibuat`);
    totalBruFiles += count;
  });

  console.log(`\n🎉 Berhasil membuat ${totalBruFiles} file .bru native Bruno!`);
  console.log(`📂 Sekarang folder "backend-staging/bruno" bisa dibuka langsung via "Open Collection" di Bruno.`);
}

main();
