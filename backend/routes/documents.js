const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let extractedText = '';

    if (fileExtension === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else if (fileExtension === '.txt') {
      extractedText = fs.readFileSync(filePath, 'utf8');
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, error: 'Unsupported file format. Please upload PDF or TXT.' });
    }

    // Clean up file to save space (since we just need the text for AI context)
    fs.unlinkSync(filePath);

    // Limit text length to avoid overflowing OpenAI token limits
    if (extractedText.length > 30000) {
      extractedText = extractedText.substring(0, 30000) + '... [Document Truncated]';
    }

    return res.json({ success: true, text: extractedText, filename: req.file.originalname });
  } catch (err) {
    console.error('Document upload error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ success: false, error: 'Failed to process document' });
  }
});

module.exports = router;
