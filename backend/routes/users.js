const express = require('express');
const router = express.Router();
const supabase = require('../utils/db');

// POST /api/users/profile
router.post('/profile', async (req, res) => {
  const { userId, classLevel, preferredLanguage, favoriteSubjects } = req.body;
  if (!supabase) return res.json({ success: true, user: { id: userId, class_level: classLevel, preferred_language: preferredLanguage, favorite_subjects: favoriteSubjects } });

  try {
    const { data: updatedUser, error: updateErr } = await supabase
      .from('users')
      .update({ class_level: classLevel, preferred_language: preferredLanguage, favorite_subjects: favoriteSubjects })
      .eq('id', userId)
      .select().single();
      
    if (updateErr) throw updateErr;
    return res.json({ success: true, user: updatedUser });
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});

// GET /api/users/dashboard/:userId
router.get('/dashboard/:userId', async (req, res) => {
  const { userId } = req.params;

  console.log(`[DASHBOARD] Fetching stats for user: ${userId}`);

  if (!supabase || userId === 'guest') {
    // Return mock dashboard stats
    return res.json({
      success: true,
      stats: {
        learningStreak: 5,
        totalQuestions: 27,
        accuracy: 85,
        topicsCompleted: 6,
        weakAreas: ["Quadratic Equations", "Thermodynamics"],
        strongAreas: ["Photosynthesis", "Basic Algebra", "English Grammar"],
        weeklyProgress: [
          { day: 'Mon', questions: 3 },
          { day: 'Tue', questions: 5 },
          { day: 'Wed', questions: 2 },
          { day: 'Thu', questions: 7 },
          { day: 'Fri', questions: 6 },
          { day: 'Sat', questions: 4 },
          { day: 'Sun', questions: 0 }
        ]
      }
    });
  }

  try {
    // 1. Fetch learning history timestamps
    const { data: historyData, error: qErr } = await supabase
      .from('learning_history')
      .select('created_at')
      .eq('user_id', userId);
    
    const totalQuestions = historyData?.length || 0;

    // Calculate actual weekly progress
    const weekMap = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
    historyData?.forEach(record => {
      const date = new Date(record.created_at);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      weekMap[days[date.getDay()]]++;
    });

    // 2. Fetch quiz completions count
    const { data: quizData, error: qzErr } = await supabase
      .from('quizzes')
      .select('score')
      .eq('user_id', userId);

    // 3. Fetch progress records for weak/strong topics
    const { data: progressData, error: progErr } = await supabase
      .from('progress')
      .select('accuracy, weak_topic, strong_topic')
      .eq('user_id', userId);

    if (qErr || qzErr || progErr) throw new Error(qErr?.message || qzErr?.message || progErr?.message);

    // Aggregate stats
    let totalScore = 0;
    let quizCount = quizData?.length || 0;
    quizData?.forEach(q => totalScore += q.score);
    
    // Average accuracy
    let sumAccuracy = 0;
    progressData?.forEach(p => sumAccuracy += p.accuracy);
    const avgAccuracy = progressData?.length ? Math.round(sumAccuracy / progressData.length) : 0;

    // Collect weak / strong subjects
    const weakSet = new Set();
    const strongSet = new Set();
    progressData?.forEach(p => {
      if (p.weak_topic && p.weak_topic !== 'None') weakSet.add(p.weak_topic);
      if (p.strong_topic && p.strong_topic !== 'None') strongSet.add(p.strong_topic);
    });

    return res.json({
      success: true,
      stats: {
        learningStreak: 0, // Should be calculated from login history, defaulting to 0 for now
        totalQuestions: totalQuestions || 0,
        accuracy: avgAccuracy || 0,
        topicsCompleted: quizCount,
        weakAreas: Array.from(weakSet).slice(0, 3),
        strongAreas: Array.from(strongSet).slice(0, 3),
        weeklyProgress: [
          { day: 'Mon', questions: weekMap['Mon'] },
          { day: 'Tue', questions: weekMap['Tue'] },
          { day: 'Wed', questions: weekMap['Wed'] },
          { day: 'Thu', questions: weekMap['Thu'] },
          { day: 'Fri', questions: weekMap['Fri'] },
          { day: 'Sat', questions: weekMap['Sat'] },
          { day: 'Sun', questions: weekMap['Sun'] }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
