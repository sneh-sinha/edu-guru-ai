const supabase = require('./db');

// Helper to save interactions in Supabase
async function saveToHistory(userId, subject, question, responseText) {
  if (!supabase || !userId) return;
  try {
    const { error } = await supabase.from('learning_history').insert({
      user_id: userId,
      subject: subject,
      question: question,
      ai_response: responseText
    });
    if (error) console.error('Supabase save error:', error.message);
  } catch (e) {
    console.error('Supabase write error:', e);
  }
}

module.exports = { saveToHistory };
