const express = require('express');
const router = express.Router();
const { Expo } = require('expo-server-sdk');
const supabase = require('../utils/db');

// Create a new Expo SDK client
let expo = new Expo();

// POST /api/notifications/register
router.post('/register', async (req, res) => {
  const { userId, pushToken } = req.body;

  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return res.status(400).json({ success: false, error: 'Invalid push token' });
  }

  if (!supabase) {
    return res.json({ success: true, message: 'Mock Token registered successfully' });
  }

  try {
    // Upsert token in database
    const { error } = await supabase
      .from('users')
      .update({ push_token: pushToken })
      .eq('id', userId);

    if (error) throw error;
    return res.json({ success: true, message: 'Token registered successfully' });
  } catch (err) {
    console.error('Error registering push token:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications/send (Admin/System only)
router.post('/send', async (req, res) => {
  const { pushToken, title, body, data } = req.body;

  if (!Expo.isExpoPushToken(pushToken)) {
    return res.status(400).json({ success: false, error: 'Invalid push token' });
  }

  const messages = [{
    to: pushToken,
    sound: 'default',
    title: title || "EduGuru AI",
    body: body || "It's time to study!",
    data: data || { screen: 'dashboard' },
  }];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }
    
    return res.json({ success: true, tickets });
  } catch (err) {
    console.error('Push send error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
