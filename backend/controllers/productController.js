const cloudinary = require("../config/cloudinary");
const Product = require("../models/Product");

function uploadBuffer(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "thewyldrift/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(file.buffer);
  });
}

async function uploadImages(files = []) {
  return Promise.all(files.map(uploadBuffer));
}

async function deleteCloudinaryImages(images = []) {
  const publicIds = images.map((image) => image.publicId).filter(Boolean);

  if (!publicIds.length) {
    return;
  }

  await Promise.all(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));
}

function getIndexedImageFiles(req, fieldPrefix) {
  const map = new Map();
  const pattern = new RegExp(`^${fieldPrefix}_(\\d+)$`);

  for (const file of req.files || []) {
    const match = String(file.fieldname).match(pattern);
    if (match) {
      map.set(Number(match[1]), file);
    }
  }

  return map;
}

function getVariantImageFiles(req) {
  return getIndexedImageFiles(req, "variantImage");
}

function getBannerImageFiles(req) {
  return getIndexedImageFiles(req, "bannerImage");
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return JSON.parse(value);
  }
  return [];
}

async function assertUniqueVariantSkus(variants, excludeProductId = null) {
  const skus = variants.map((variant) => String(variant.sku).trim().toUpperCase()).filter(Boolean);
  if (!skus.length) {
    return;
  }

  const filter = { "variants.sku": { $in: skus } };
  if (excludeProductId) {
    filter._id = { $ne: excludeProductId };
  }

  const conflict = await Product.findOne(filter).select("productName variants.sku").lean();
  if (conflict) {
    const err = new Error("One or more SKUs are already used by another product");
    err.statusCode = 409;
    throw err;
  }
}

async function buildVariantsFromRequest(req) {
  const variantsInput = req.body.variants || [];
  const imageFiles = getVariantImageFiles(req);
  const built = [];

  for (let index = 0; index < variantsInput.length; index += 1) {
    const row = variantsInput[index];
    let image = row.existingImage;

    if (imageFiles.has(index)) {
      const [uploaded] = await uploadImages([imageFiles.get(index)]);
      image = uploaded;
    }

    if (!image?.url || !image?.publicId) {
      const err = new Error(`Variant row ${index + 1}: product image is required`);
      err.statusCode = 400;
      throw err;
    }

    built.push({
      ...(row._id ? { _id: row._id } : {}),
      stock: Number(row.stock),
      sku: String(row.sku).trim().toUpperCase(),
      color: String(row.color).trim(),
      size: row.size,
      image,
    });
  }

  return built;
}

async function buildBannerImagesFromRequest(req) {
  let input;
  try {
    input = parseJsonArray(req.body.bannerImages);
  } catch {
    const err = new Error("Invalid banner images payload");
    err.statusCode = 400;
    throw err;
  }

  if (!Array.isArray(input)) {
    const err = new Error("Invalid banner images payload");
    err.statusCode = 400;
    throw err;
  }

  if (input.length > 5) {
    const err = new Error("At most 5 banner images are allowed");
    err.statusCode = 400;
    throw err;
  }

  const imageFiles = getBannerImageFiles(req);
  const built = [];

  for (let index = 0; index < input.length; index += 1) {
    const row = input[index];
    let image = row.existingImage;

    if (imageFiles.has(index)) {
      const [uploaded] = await uploadImages([imageFiles.get(index)]);
      image = uploaded;
    }

    if (!image?.url || !image?.publicId) {
      continue;
    }

    built.push(image);
  }

  if (built.length > 5) {
    const err = new Error("At most 5 banner images are allowed");
    err.statusCode = 400;
    throw err;
  }

  return built;
}

function collectVariantImages(variants = []) {
  return variants.map((variant) => variant.image).filter(Boolean);
}

function normalizeProduct(product) {
  const plain = product.toObject ? product.toObject() : product;
  const variants = plain.variants || [];
  const images =
    plain.images?.length > 0 ? plain.images : variants.map((variant) => variant.image).filter(Boolean);

  return {
    ...plain,
    id: String(plain._id),
    image: images?.[0]?.url || variants?.[0]?.image?.url || "",
    images,
    variants,
  };
}

async function createProduct(req, res, next) {
  try {
    const variants = await buildVariantsFromRequest(req);
    const bannerImages = await buildBannerImagesFromRequest(req);
    await assertUniqueVariantSkus(variants);

    const product = await Product.create({
      productName: req.body.productName,
      description: req.body.description,
      price: req.body.price,
      discountPrice: req.body.discountPrice,
      category: req.body.category,
      tags: req.body.tags,
      featured: req.body.featured,
      active: req.body.active,
      variants,
      bannerImages,
    });

    return res.status(201).json({
      success: true,
      message: "Product created",
      product: normalizeProduct(product),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
}

/** Full catalogue for admin UI (requires Bearer token on /api/admin/products). */
async function getAdminProductList(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 500, 1), 500);
    const docs = await Product.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({
      success: true,
      products: docs.map((p) => normalizeProduct(p)),
    });
  } catch (error) {
    return next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.featured !== undefined) {
      filter.featured = req.query.featured === "true";
    }

    if (req.query.active !== undefined) {
      filter.active = req.query.active === "true";
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      products: products.map(normalizeProduct),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, product: normalizeProduct(product) });
  } catch (error) {
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const variants = await buildVariantsFromRequest(req);
    const bannerImages = await buildBannerImagesFromRequest(req);
    await assertUniqueVariantSkus(variants, product._id);

    const previousImages = collectVariantImages(product.variants || []);
    const nextImages = collectVariantImages(variants);
    const removedVariantImages = previousImages.filter(
      (oldImage) => !nextImages.some((image) => image.publicId === oldImage.publicId)
    );

    const previousBanners = product.bannerImages || [];
    const removedBannerImages = previousBanners.filter(
      (oldImage) => !bannerImages.some((image) => image.publicId === oldImage.publicId)
    );

    product.productName = req.body.productName;
    product.description = req.body.description;
    product.price = req.body.price;
    product.discountPrice = req.body.discountPrice;
    product.category = req.body.category;
    product.tags = req.body.tags;
    product.featured = req.body.featured;
    product.active = req.body.active;
    product.variants = variants;
    product.bannerImages = bannerImages;

    await product.save();
    await deleteCloudinaryImages([...removedVariantImages, ...removedBannerImages]);

    return res.json({
      success: true,
      message: "Product updated",
      product: normalizeProduct(product),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const images = [
      ...(product.bannerImages || []),
      ...(product.images || []),
      ...collectVariantImages(product.variants || []),
    ];
    await deleteCloudinaryImages(images);
    await product.deleteOne();

    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getAdminProductList,
  getProduct,
  updateProduct,
  deleteProduct,
};
