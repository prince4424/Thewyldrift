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

function normalizeProduct(product) {
  const plain = product.toObject ? product.toObject() : product;

  return {
    ...plain,
    id: String(plain._id),
    image: plain.images?.[0]?.url || "",
  };
}

async function createProduct(req, res, next) {
  try {
    const uploadedImages = await uploadImages(req.files);

    if (!uploadedImages.length) {
      return res.status(400).json({ success: false, message: "At least one image is required" });
    }

    const product = await Product.create({
      ...req.body,
      images: uploadedImages,
    });

    return res.status(201).json({
      success: true,
      message: "Product created",
      product: normalizeProduct(product),
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

    const existingImages = req.body.existingImages || [];
    const uploadedImages = await uploadImages(req.files);
    const nextImages = [...existingImages, ...uploadedImages];

    if (!nextImages.length) {
      return res.status(400).json({ success: false, message: "At least one image is required" });
    }

    const removedImages = product.images.filter(
      (oldImage) => !nextImages.some((image) => image.publicId === oldImage.publicId)
    );

    Object.assign(product, {
      ...req.body,
      images: nextImages,
    });

    await product.save();
    await deleteCloudinaryImages(removedImages);

    return res.json({
      success: true,
      message: "Product updated",
      product: normalizeProduct(product),
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await deleteCloudinaryImages(product.images);
    await product.deleteOne();

    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
