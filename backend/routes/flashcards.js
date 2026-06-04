const express = require('express');
const router = express.Router();
const supabase = require('../utils/db');

// GET /api/flashcards/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  
  if (!supabase) {
    return res.json({
      success: true,
      flashcards: [
        { id: '1', front: "What is Newton's First Law?", back: "Law of Inertia: An object at rest stays at rest unless acted upon by a force." },
        { id: '2', front: "Solve for x: 2x = 10", back: "x = 5" },
        { id: '3', front: "What is the powerhouse of the cell?", back: "Mitochondria" }
      ]
    });
  }

  try {
    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      // Only fetch cards due for review today or earlier
      .lte('next_review_date', new Date().toISOString())
      .limit(20);

    if (error) throw error;
    return res.json({ success: true, flashcards });
  } catch (err) {
    console.error('Error fetching flashcards:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
