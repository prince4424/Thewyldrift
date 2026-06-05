const mongoose = require("mongoose");

const productImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const ALLOWED_SIZES = ["S", "M", "L", "XL", "XXL"];

const productVariantSchema = new mongoose.Schema(
  {
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      enum: ALLOWED_SIZES,
    },
    image: {
      type: productImageSchema,
      required: true,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    /** Sum of variant stock — synced on save when variants exist. */
    stock: {
      type: Number,
      min: 0,
      default: 0,
    },
    /** First variant SKU — legacy display / search. */
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    variants: {
      type: [productVariantSchema],
      default: [],
      validate: {
        validator(variants) {
          return variants.length > 0;
        },
        message: "At least one stock variant is required",
      },
    },
    images: {
      type: [productImageSchema],
      default: [],
    },
    bannerImages: {
      type: [productImageSchema],
      default: [],
      validate: {
        validator(images) {
          return images.length <= 5;
        },
        message: "At most 5 banner images are allowed",
      },
    },
  },
  { timestamps: true }
);

productSchema.pre("validate", function syncDerivedFromVariants() {
  if (!this.variants?.length) {
    return;
  }

  this.stock = this.variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
  this.sku = this.variants[0]?.sku || this.sku;
  this.sizes = [...new Set(this.variants.map((variant) => variant.size).filter(Boolean))];
  this.colors = [...new Set(this.variants.map((variant) => variant.color).filter(Boolean))];
  this.images = this.variants.map((variant) => variant.image).filter((image) => image?.url);
});

productSchema.index({
  productName: "text",
  description: "text",
  category: "text",
  tags: "text",
  sku: "text",
  "variants.sku": "text",
});

module.exports = mongoose.model("Product", productSchema);
module.exports.ALLOWED_SIZES = ALLOWED_SIZES;
