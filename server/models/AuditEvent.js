const { Schema, model } = require('mongoose');

const auditSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, maxlength: 80 },
  target: { type: Schema.Types.ObjectId, ref: 'User' },
  details: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, index: true },
});

const AuditEvent = model('AuditEvent', auditSchema);

async function recordAudit(actor, action, target, details = {}) {
  try {
    await AuditEvent.create({ actor, action, target, details });
  } catch (err) {
    console.error(`Audit write failed: ${err.message}`);
  }
}

module.exports = { AuditEvent, recordAudit };
