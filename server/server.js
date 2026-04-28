const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

const port = 8080;
const root = path.join(__dirname, "..", "client");
const dbPath = path.join(__dirname, "db.json");

// Load .env
const envPath = path.join(__dirname, ".env");
const envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const envLines = envContent.split("\n");

  for (const line of envLines) {
    const [key, ...rest] = line.split("=");
    if (!key) continue;
    envVars[key.trim()] = rest.join("=").trim();
  }
}

const adminPasskey = envVars.ADMIN_PASSKEY || "1234567899";
const cloudinaryUploadPreset = envVars.CLOUDINARY_UPLOAD_PRESET || "";
const cloudinaryUrl = envVars.CLOUDINARY_URL || "";
const cloudinaryConfig = cloudinaryUrl ? parseCloudinaryUrl(cloudinaryUrl) : null;

function parseCloudinaryUrl(url) {
  const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  return match ? { apiKey: match[1], apiSecret: match[2], cloudName: match[3] } : null;
}

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
    sizes: Array.isArray(input.sizes)
      ? input.sizes.map(String).map((value) => value.trim()).filter(Boolean)
      : String(input.sizes || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
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

  if (!product.sizes.length) {
    return "At least one size is required";
  }

  if (product.stock < 0) {
    return "Stock cannot be negative";
  }

  return "";
}

function isCloudinaryUrl(image) {
  return typeof image === "string" && /res\.cloudinary\.com/.test(image);
}

async function uploadImageToCloudinary(imageUrl) {
  if (!cloudinaryConfig || !/^https?:\/\//i.test(imageUrl) || isCloudinaryUrl(imageUrl)) {
    return imageUrl;
  }

  const form = new FormData();
  form.append("file", imageUrl);
  if (cloudinaryUploadPreset) {
    form.append("upload_preset", cloudinaryUploadPreset);
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
  const auth = Buffer.from(`${cloudinaryConfig.apiKey}:${cloudinaryConfig.apiSecret}`).toString("base64");

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
    },
    body: form,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Cloudinary upload failed");
  }

  return result.secure_url || imageUrl;
}

function checkAdminAuth(req) {
  const authHeader = req.headers['x-admin-password'];
  return authHeader === adminPasskey;
}

async function handleApi(req, res, pathname) {
  const db = readDb();
  const productId = pathname.match(/^\/api\/products\/([^/]+)$/)?.[1];

  if (req.method === "POST" && pathname === "/api/admin/login") {
    const body = await readBody(req);
    if (String(body.password) === adminPasskey) {
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 401, { error: "Invalid password" });
    return;
  }

  if (req.method === "POST" && pathname === "/api/upload") {
    if (!checkAdminAuth(req)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    if (!cloudinaryConfig) {
      sendJson(res, 500, { error: "Cloudinary is not configured in .env" });
      return;
    }

    const body = await readBody(req);
    const fileData = String(body.fileData || "").trim();
    const fileName = String(body.fileName || "image").trim();

    if (!fileData) {
      sendJson(res, 400, { error: "No file data provided" });
      return;
    }

    try {
      const form = new FormData();
      form.append("file", fileData);
      if (cloudinaryUploadPreset) {
        form.append("upload_preset", cloudinaryUploadPreset);
      }
      form.append("public_id", path.parse(fileName).name);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
      const auth = Buffer.from(`${cloudinaryConfig.apiKey}:${cloudinaryConfig.apiSecret}`).toString("base64");

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
        },
        body: form,
      });

      const result = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(result.error?.message || "Cloudinary upload failed");
      }

      sendJson(res, 200, { url: result.secure_url || result.url });
    } catch (error) {
      sendJson(res, 500, { error: error.message || "Upload failed" });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/api/products") {
    sendJson(res, 200, db.products);
    return;
  }

  if (req.method === "POST" && pathname === "/api/products") {
    if (!checkAdminAuth(req)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    const product = cleanProduct(await readBody(req));
    const error = validateProduct(product);

    if (error) {
      sendJson(res, 400, { error });
      return;
    }

    if (cloudinaryConfig && product.image) {
      try {
        product.image = await uploadImageToCloudinary(product.image);
      } catch (cloudError) {
        sendJson(res, 500, { error: `Image upload failed: ${cloudError.message}` });
        return;
      }
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
    if (!checkAdminAuth(req)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
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

    if (cloudinaryConfig && product.image) {
      try {
        product.image = await uploadImageToCloudinary(product.image);
      } catch (cloudError) {
        sendJson(res, 500, { error: `Image upload failed: ${cloudError.message}` });
        return;
      }
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
    if (!checkAdminAuth(req)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
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

server.listen(port, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let ipAddress = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ipAddress = iface.address;
        break;
      }
    }
    if (ipAddress !== 'localhost') break;
  }
  console.log(`The Wyldrift is running at http://localhost:${port}`);
  console.log(`Network access: http://${ipAddress}:${port}`);
  console.log(`Admin panel: http://${ipAddress}:${port}/admin.html`);
});
