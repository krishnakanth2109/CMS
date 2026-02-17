import Candidate from '../models/Candidate.js';
import mongoose from 'mongoose';
import xlsx from 'xlsx';
import fs from 'fs';

// Helper: Find column by flexible matching
const findColumn = (rowKeys, ...possibleNames) => {
  const normalized = possibleNames.map(n => n.toLowerCase().replace(/\s+/g, ''));
  
  for (const key of rowKeys) {
    const keyNorm = key.toLowerCase().replace(/\s+/g, '');
    
    // Exact match
    if (normalized.includes(keyNorm)) return key;
    
    // Partial/substring match
    for (const name of possibleNames) {
      if (keyNorm.includes(name.toLowerCase().replace(/\s+/g, ''))) {
        return key;
      }
    }
  }
  return null;
};

// Helper: Extract and clean value
const getValue = (row, columnKey) => {
  if (!columnKey || !(columnKey in row)) return '';
  const val = row[columnKey];
  
  // Handle scientific notation (Excel stores large numbers as 7.84E+09)
  if (typeof val === 'number') {
    let str = val.toString();
    if (str.includes('e') || str.includes('E')) {
      const num = Number(val);
      str = num.toFixed(0);
    }
    return str;
  }
  
  return (val || '').toString().trim();
};

// @desc    Bulk import candidates from Excel file
// @route   POST /api/candidates/bulk-import
// @access  Private
export const bulkImportCandidates = async (req, res) => {
  let tempFilePath = req.file?.path;
  console.log('bulkImportCandidates invoked');
  console.log('Authenticated user present?', !!req.user, 'user id/name:', req.user ? `${req.user._id}/${req.user.name}` : 'none');
  console.log('Uploaded tempFilePath:', tempFilePath);

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Read Excel file
    const fileBuffer = fs.readFileSync(tempFilePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    if (!data || data.length === 0) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ success: false, message: 'Excel file is empty' });
    }

    const rowKeys = Object.keys(data[0] || {});
    console.log('=== EXCEL IMPORT ===');
    console.log('Available columns:', rowKeys);
    console.log('Total rows to process:', data.length);

    // Find column keys
    const contactCol = findColumn(rowKeys, 'contact', 'phone', 'mobile', 'no');
    const nameCol = findColumn(rowKeys, 'name', 'candidate', 'full name');
    const emailCol = findColumn(rowKeys, 'email', 'mail');
    const clientCol = findColumn(rowKeys, 'client', 'company');
    const positionCol = findColumn(rowKeys, 'position', 'job title', 'designation');
    const locCol = findColumn(rowKeys, 'loc', 'location', 'city');
    const expCol = findColumn(rowKeys, 'experience', 'exp', 'total exp');
    const ctcCol = findColumn(rowKeys, 'current', 'ctc', 'current salary');
    const ectcCol = findColumn(rowKeys, 'exp ctc', 'expected');
    const noticeCol = findColumn(rowKeys, 'notice');
    const feedbackCol = findColumn(rowKeys, 'feedback', 'remarks', 'comments');
    const sourceCol = findColumn(rowKeys, 'source', 'reference');

    console.log('Mapped columns:', { contact: contactCol, name: nameCol, email: emailCol, client: clientCol, position: positionCol });

    // Map rows
    const validCandidates = [];
    const mappingErrors = [];

    data.forEach((row, index) => {
      try {
        const contactRaw = getValue(row, contactCol);
        // Extract just the digits from contact - no length requirement
        const contact = contactRaw.replace(/[^\d]/g, '');
        const email = getValue(row, emailCol).toLowerCase().trim();
        const name = getValue(row, nameCol).trim();
        const position = getValue(row, positionCol).trim();
        const client = getValue(row, clientCol).trim();
        
        // Validate before creating candidate
        if (!name || name.length < 2) {
          mappingErrors.push({ 
            row: index + 2, 
            candidate: name || 'Unknown',
            error: 'Name is required and must be at least 2 characters' 
          });
          return;
        }
        
        if (!email || !email.includes('@')) {
          mappingErrors.push({ 
            row: index + 2, 
            candidate: name,
            error: 'Valid email is required' 
          });
          return;
        }
        
        if (!position) {
          mappingErrors.push({ 
            row: index + 2, 
            candidate: name,
            error: 'Position is required' 
          });
          return;
        }
        
        if (!client) {
          mappingErrors.push({ 
            row: index + 2, 
            candidate: name,
            error: 'Client is required' 
          });
          return;
        }
        
        const candidate = {
          name: name,
          email: email,
          position: position,
          client: client,
          skills: [],
          currentLocation: getValue(row, locCol) || '',
          totalExperience: getValue(row, expCol) || '',
          ctc: getValue(row, ctcCol) || '',
          ectc: getValue(row, ectcCol) || '',
          noticePeriod: getValue(row, noticeCol) || '',
          remarks: getValue(row, feedbackCol) || '',
          source: getValue(row, sourceCol) || 'Excel Import',
          recruiterId: req.user._id,
          recruiterName: req.user.name,
          status: 'Submitted',
          active: true,
          dateAdded: new Date()
        };
        
        // Only add contact if it has actual digits
        if (contact && contact.length > 0) {
          candidate.contact = contact;
        }

        // Log first 3 rows for debugging
        if (index < 3) {
          console.log(`\n--- Row ${index + 2} ---`);
          console.log('Mapped candidate:', JSON.stringify(candidate, null, 2));
        }

        validCandidates.push(candidate);
      } catch (err) {
        console.error(`Row ${index + 2} processing error:`, err.message);
        mappingErrors.push({ row: index + 2, candidate: 'Unknown', error: `Processing error: ${err.message}` });
      }
    });

    console.log('Valid candidates:', validCandidates.length, 'Mapping errors:', mappingErrors.length);

    if (validCandidates.length === 0) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ 
        success: false, 
        message: 'No valid rows found in Excel', 
        details: mappingErrors.slice(0, 10)
      });
    }

    let insertedCount = 0;
    let duplicateCount = 0;

    // --- Reserve a block of candidateId sequence numbers atomically ---
    try {
      let CounterModel;
      try {
        CounterModel = mongoose.model('Counter');
      } catch (e) {
        const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
        CounterModel = mongoose.model('Counter', counterSchema);
      }

      const batchSize = validCandidates.length;
      const beforeCounter = await CounterModel.findById('candidateId');
      console.log('Counter before update:', beforeCounter);
      const counterDoc = await CounterModel.findOneAndUpdate(
        { _id: 'candidateId' },
        { $inc: { seq: batchSize } },
        { new: true, upsert: true }
      );
      console.log('Counter after update:', counterDoc);

      const finalSeq = counterDoc.seq || batchSize;
      const startSeq = finalSeq - batchSize + 1;

      // Assign candidateId to each valid candidate deterministically
      validCandidates.forEach((c, i) => {
        const seq = startSeq + i;
        c.candidateId = `CAND-${seq.toString().padStart(4, '0')}`;
      });

      console.log('Reserved candidateId range:', `CAND-${startSeq.toString().padStart(4,'0')}`,
        'to', `CAND-${finalSeq.toString().padStart(4,'0')}`);
      console.log('Assigned candidateIds preview:', validCandidates.map(v => v.candidateId));
    } catch (err) {
      console.error('Failed to reserve candidateId block:', err);
      // proceed without reservation; pre-save may still generate ids
    }

    // Ensure every candidate has some candidateId (fallback unique assignment)
    const fallbackBase = Date.now();
    validCandidates.forEach((c, i) => {
      if (!c.candidateId) {
        c.candidateId = `CAND-${String(fallbackBase + i).slice(-8)}`;
      }
    });
      console.log('Final assigned candidateIds (after fallback):', validCandidates.map(v => v.candidateId));
    
    // Debug: show full candidate objects just before save
    console.log('Final candidate objects preview before save:', JSON.stringify(validCandidates.slice(0, 10), null, 2));

    try {
      console.log('Attempting to insert', validCandidates.length, 'candidates (one-by-one save)');

      const results = await Promise.allSettled(validCandidates.map((c) => {
        const doc = new Candidate(c);
        return doc.save();
      }));

      const successes = results.filter(r => r.status === 'fulfilled').map((r) => r.value);
      const failures = results.filter(r => r.status === 'rejected').map((r, idx) => ({
        index: idx,
        reason: r.reason
      }));

      insertedCount = successes.length;
      console.log('Inserted count (per-row):', insertedCount, 'Failures:', failures.length);

      // Collect duplicate count and mappingErrors for failures
      failures.forEach(f => {
        const reason = f.reason;
        const message = reason && reason.message ? reason.message : String(reason);
        const rowNumber = f.index + 2; // offset by header
        mappingErrors.push({ row: rowNumber, candidate: validCandidates[f.index]?.name || 'Unknown', error: message });
        if (/11000|E11000|duplicate/i.test(message)) duplicateCount += 1;
        console.error(`Row ${rowNumber} insert failed:`, message);
      });

    } catch (error) {
      console.error('Bulk save unexpected error:', error && error.message ? error.message : error);
      // If something unexpected happened, ensure file clean up and return error
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(500).json({ success: false, message: 'Critical error during import', error: error && error.message ? error.message : String(error) });
    }

    // Clean up file
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    res.json({
      success: true,
      message: `Import complete: ${insertedCount} added, ${duplicateCount} duplicates skipped.`,
      imported: insertedCount,
      duplicates: duplicateCount,
      total: data.length,
      errors: mappingErrors.length > 0 ? mappingErrors.slice(0, 10) : undefined
    });

  } catch (error) {
    console.error('Bulk import critical failure:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    res.status(500).json({
      success: false,
      message: 'Critical error during import',
      error: error.message,
      details: error.code ? `DB Error: ${error.code}` : undefined
    });
  }
};