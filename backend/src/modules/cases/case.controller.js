// backend/src/modules/cases/case.controller.js
const Case = require('./case.model');
const Fragment = require('../fragments/fragment.model');

exports.getAllCases = async (req, res, next) => {
  try {
    // Basic pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [cases, total] = await Promise.all([
      Case.find().skip(skip).limit(limit).sort('-createdAt').lean(),
      Case.countDocuments(),
    ]);

    res.json({ status: 'success', total, page, limit, data: cases });
  } catch (err) {
    next(err);
  }
};

exports.getCaseById = async (req, res, next) => {
  try {
    const c = await Case.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ status: 'error', message: 'Case not found' });
    res.json({ status: 'success', data: c });
  } catch (err) {
    next(err);
  }
};

exports.createCase = async (req, res, next) => {
  try {
    const c = await Case.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ status: 'success', data: c });
  } catch (err) {
    next(err);
  }
};

exports.updateCase = async (req, res, next) => {
  try {
    // FIX: whitelist the fields that are safe to update.
    // Previously req.body was passed directly, allowing overwrite of any field
    // including caseId, createdBy, and fragmentCount.
    const { title, description, status, priority, assignedAgent } = req.body;
    const allowed = { title, description, status, priority, assignedAgent };
    // Remove undefined keys so partial updates work
    Object.keys(allowed).forEach(k => allowed[k] === undefined && delete allowed[k]);

    const c = await Case.findByIdAndUpdate(req.params.id, allowed, {
      new: true,
      runValidators: true,
    });
    if (!c) return res.status(404).json({ status: 'error', message: 'Case not found' });
    res.json({ status: 'success', data: c });
  } catch (err) {
    next(err);
  }
};

exports.deleteCase = async (req, res, next) => {
  try {
    const c = await Case.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ status: 'error', message: 'Case not found' });

    // FIX: cascade delete all fragments that belonged to this case
    // so we don't leave orphaned records in the DB.
    await Fragment.deleteMany({ caseId: req.params.id });

    res.json({ status: 'success', message: 'Case and all associated fragments deleted' });
  } catch (err) {
    next(err);
  }
};
