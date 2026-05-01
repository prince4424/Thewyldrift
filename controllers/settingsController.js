const SiteSettings = require("../models/SiteSettings");

const DEFAULT_KEY = "default";

async function getSettings(req, res, next) {
  try {
    const settings = await SiteSettings.findOne({ key: DEFAULT_KEY }).lean();
    if (!settings) {
      return res.json({ success: true, settings: { key: DEFAULT_KEY } });
    }
    return res.json({ success: true, settings });
  } catch (error) {
    return next(error);
  }
}

async function upsertSettings(req, res, next) {
  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { key: DEFAULT_KEY },
      { key: DEFAULT_KEY, ...req.body },
      { upsert: true, new: true, runValidators: true }
    ).lean();
    return res.json({ success: true, message: "Settings saved", settings });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getSettings, upsertSettings };

