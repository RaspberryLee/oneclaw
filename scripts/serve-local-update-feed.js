#!/usr/bin/env node
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FEED_ROOT = path.join(ROOT, "local-update-feed");
const PORT = Number(process.env.ONECLAW_LOCAL_UPDATE_PORT || 8080);

const CONTENT_TYPES = {
  ".yml": "text/yaml; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
  ".exe": "application/vnd.microsoft.portable-executable",
  ".zip": "application/zip",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function safeResolve(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const relativePath = cleanPath === "/" ? "index.html" : cleanPath.replace(/^\/+/, "");
  const resolved = path.resolve(FEED_ROOT, relativePath);
  if (!resolved.startsWith(FEED_ROOT)) {
    return null;
  }
  return resolved;
}

function send(res, statusCode, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(body);
}

function main() {
  fs.mkdirSync(path.join(FEED_ROOT, "releases"), { recursive: true });

  const server = http.createServer((req, res) => {
    if (!req.url) {
      send(res, 400, "Bad Request");
      return;
    }

    const targetPath = safeResolve(req.url);
    if (!targetPath) {
      send(res, 403, "Forbidden");
      return;
    }

    fs.stat(targetPath, (statErr, stat) => {
      if (statErr || !stat.isFile()) {
        send(res, 404, "Not Found");
        return;
      }

      const ext = path.extname(targetPath).toLowerCase();
      const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": stat.size,
      });
      fs.createReadStream(targetPath).pipe(res);
    });
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`[local-update] 本地更新源已启动: http://127.0.0.1:${PORT}/releases/`);
    console.log(`[local-update] 目录: ${path.relative(ROOT, path.join(FEED_ROOT, "releases"))}`);
  });
}

main();
