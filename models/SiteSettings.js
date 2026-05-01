const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },

    // Homepage
    homeCategoryTitle: { type: String, trim: true, default: "By Category" },
    homeCategoryKicker: { type: String, trim: true, default: "Shop" },
    homeLatestTitle: { type: String, trim: true, default: "Latest Products" },
    homeFeaturedCategory: { type: String, trim: true, default: "T-Shirts" },

    // Header
    cartBadge: { type: Number, default: 44, min: 0 },

    // Footer
    footerLinks: {
      type: [
        {
          label: { type: String, required: true, trim: true },
          href: { type: String, required: true, trim: true },
        },
      ],
      default: [
        { label: "About", href: "#top" },
        { label: "Contact", href: "#top" },
        { label: "Instagram", href: "#top" },
        { label: "Returns", href: "#top" },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);

