const mongoose = require('mongoose');
const { jobEvents } = require('../services/job-queue.service');

const clientsByUser = new Map();

function parseOwnerId(req) {
  if (!req.user || !req.user.id || !mongoose.isValidObjectId(req.user.id)) return null;
  return String(req.user.id);
}

function sendSse(res, event, payload) {
  const compactPayload = JSON.stringify(payload);
  res.write(`event: ${event}\n`);
  res.write(`data: ${compactPayload}\n\n`);
}

function ensureGlobalListener() {
  if (ensureGlobalListener.initialized) return;
  ensureGlobalListener.initialized = true;

  jobEvents.on('post-status', (payload) => {
    const userId = payload.userId;
    if (!userId || !clientsByUser.has(userId)) return;
    const clients = clientsByUser.get(userId);
    clients.forEach((res) => {
      sendSse(res, 'post-status', payload);
    });
  });
}

function streamPostEvents(req, res) {
  const ownerId = parseOwnerId(req);
  if (!ownerId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  ensureGlobalListener();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  sendSse(res, 'connected', { ok: true, userId: ownerId, ts: Date.now() });

  if (!clientsByUser.has(ownerId)) clientsByUser.set(ownerId, new Set());
  clientsByUser.get(ownerId).add(res);

  const heartbeat = setInterval(() => {
    sendSse(res, 'heartbeat', { ts: Date.now() });
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const set = clientsByUser.get(ownerId);
    if (set) {
      set.delete(res);
      if (set.size === 0) clientsByUser.delete(ownerId);
    }
  });
}

module.exports = {
  streamPostEvents,
};
