const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const port = 8080;
const root = __dirname;
const dbPath = path.join(root, "db.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function readDb() {
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function cleanProduct(input) {
  return {
    name: String(input.name || "").trim(),
    category: String(input.category || "").trim(),
    price: String(input.price || "").trim(),
    details: String(input.details || "").trim(),
    image: String(input.image || "").trim(),
    stock: Number.parseInt(input.stock, 10) || 0,
    active: input.active !== false,
  };
}

function validateProduct(product) {
  const required = ["name", "category", "price", "details", "image"];
  const missing = required.filter((key) => !product[key]);

  if (missing.length) {
    return `${missing.join(", ")} required`;
  }

  if (product.stock < 0) {
    return "Stock cannot be negative";
  }

  return "";
}

async function handleApi(req, res, pathname) {
  const db = readDb();
  const productId = pathname.match(/^\/api\/products\/([^/]+)$/)?.[1];

  if (req.method === "GET" && pathname === "/api/products") {
    sendJson(res, 200, db.products);
    return;
  }

  if (req.method === "POST" && pathname === "/api/products") {
    const product = cleanProduct(await readBody(req));
    const error = validateProduct(product);

    if (error) {
      sendJson(res, 400, { error });
      return;
    }

    const newProduct = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...product,
    };

    db.products.unshift(newProduct);
    writeDb(db);
    sendJson(res, 201, newProduct);
    return;
  }

  if (req.method === "PUT" && productId) {
    const index = db.products.findIndex((product) => product.id === productId);

    if (index === -1) {
      sendJson(res, 404, { error: "Product not found" });
      return;
    }

    const product = cleanProduct(await readBody(req));
    const error = validateProduct(product);

    if (error) {
      sendJson(res, 400, { error });
      return;
    }

    db.products[index] = {
      ...db.products[index],
      ...product,
      updatedAt: new Date().toISOString(),
    };
    writeDb(db);
    sendJson(res, 200, db.products[index]);
    return;
  }

  if (req.method === "DELETE" && productId) {
    const originalLength = db.products.length;
    db.products = db.products.filter((product) => product.id !== productId);

    if (db.products.length === originalLength) {
      sendJson(res, 404, { error: "Product not found" });
      return;
    }

    writeDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: "API route not found" });
}

function serveStatic(req, res, pathname) {
  const requestedPath = pathname === "/" ? "index.html" : `.${pathname}`;
  const filePath = path.resolve(root, requestedPath);
  const rootWithSeparator = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (filePath !== root && !filePath.startsWith(rootWithSeparator)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname);
      return;
    }

    serveStatic(req, res, decodeURIComponent(url.pathname));
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(port, () => {
  console.log(`The Wyldrift is running at http://localhost:${port}`);
  console.log(`Admin panel: http://localhost:${port}/admin.html`);
});
