import Candidate from '../models/Candidate.js';
import xlsx from 'xlsx';
import fs from 'fs';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strict column finder — exact match first, then starts-with (≥5 chars).
 * NO loose substring matching to prevent "Name" matching "clientname" etc.
 */
const findColumn = (rowKeys, ...possibleNames) => {
  const normalized = possibleNames.map(n => n.toLowerCase().replace(/[\s_]+/g, ''));

  // Pass 1: Exact match
  for (const key of rowKeys) {
    const keyNorm = key.toLowerCase().replace(/[\s_]+/g, '');
    if (normalized.includes(keyNorm)) return key;
  }

  // Pass 2: Key starts-with a possible name that is ≥5 chars
  for (const key of rowKeys) {
    const keyNorm = key.toLowerCase().replace(/[\s_]+/g, '');
    for (const name of normalized) {
      if (name.length >= 5 && keyNorm.startsWith(name)) return key;
    }
  }

  return null;
};

const getValue = (row, columnKey) => {
  if (!columnKey || !(columnKey in row)) return '';
  const val = row[columnKey];
  if (typeof val === 'number') {
    const str = val.toString();
    if (str.toLowerCase().includes('e')) return Number(val).toFixed(0);
    return str;
  }
  return (val ?? '').toString().trim();
};

const VALID_STATUSES = [
  'Submitted', 'Shared Profiles', 'Yet to attend', 'Turnups',
  'No Show', 'Selected', 'Joined', 'Rejected', 'Pipeline', 'Hold', 'Backout'
];

/**
 * Get the next available CAND-XXXX number from the real DB.
 * Always reads live from MongoDB — never gets out of sync.
 */
const getNextCandidateNumber = async () => {
  const last = await Candidate.findOne(
    { candidateId: { $regex: /^CAND-\d+$/ } },
    { candidateId: 1 }
  ).sort({ candidateId: -1 });

  if (!last || !last.candidateId) return 1;
  const num = parseInt(last.candidateId.split('-')[1], 10);
  return isNaN(num) ? 1 : num + 1;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER
// @route  POST /api/candidates/bulk-import
// @access Private
//
// UPSERT:  existing email → UPDATE,  new email → CREATE
//
// ★ CRITICAL FIX: New candidates are saved SEQUENTIALLY (one by one), NOT
//   in parallel (Promise.allSettled). This is the only safe way to guarantee
//   unique auto-incrementing IDs, because parallel saves all read the same
//   "last" ID from DB before any of them have written their new record.
// ─────────────────────────────────────────────────────────────────────────────
export const bulkImportCandidates = async (req, res) => {
  const tempFilePath = req.file?.path;

  console.log('=== BULK IMPORT START ===');
  console.log('User:', req.user ? `${req.user._id} / ${req.user.name}` : 'NONE');
  console.log('File:', tempFilePath);

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // ── 1. Read workbook ──────────────────────────────────────────────────
    const fileBuffer = fs.readFileSync(tempFilePath);
    const workbook   = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName  = workbook.SheetNames[0];
    const worksheet  = workbook.Sheets[sheetName];
    const data       = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    if (!data || data.length === 0) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ success: false, message: 'Excel file is empty.' });
    }

    const rowKeys = Object.keys(data[0] || {});
    console.log('Columns detected:', rowKeys);
    console.log('Total data rows:', data.length);

    // ── 2. Map columns ────────────────────────────────────────────────────
    const cols = {
      name     : findColumn(rowKeys, 'name', 'candidatename', 'fullname'),
      email    : findColumn(rowKeys, 'email', 'emailid', 'mail'),
      contact  : findColumn(rowKeys, 'contact', 'phone', 'mobile', 'mobileno', 'phoneno', 'contactno'),
      position : findColumn(rowKeys, 'position', 'jobtitle', 'designation', 'role'),
      // client — strict: only exact "client" variants, never "company" alone
      client   : findColumn(rowKeys, 'client', 'clientname', 'clientcompany', 'hiringclient'),
      skills   : findColumn(rowKeys, 'skills', 'skill', 'technologies', 'techstack'),
      location : findColumn(rowKeys, 'currentlocation', 'location', 'city', 'loc'),
      exp      : findColumn(rowKeys, 'totalexperience', 'totalexp', 'experience', 'yoe'),
      relExp   : findColumn(rowKeys, 'relevantexperience', 'relevantexp', 'relexp'),
      // ectc BEFORE ctc so "ECTC" / "Expected CTC" columns match ectc first
      ectc     : findColumn(rowKeys, 'ectc', 'expectedctc', 'expectedsalary', 'expctc'),
      ctc      : findColumn(rowKeys, 'ctc', 'currentctc', 'currentsalary'),
      notice   : findColumn(rowKeys, 'noticeperiod', 'notice', 'np'),
      remarks  : findColumn(rowKeys, 'remarks', 'feedback', 'comments', 'notes'),
      source   : findColumn(rowKeys, 'source', 'reference'),
      status   : findColumn(rowKeys, 'status'),
      company  : findColumn(rowKeys, 'currentcompany', 'presentcompany', 'employer'),
      education: findColumn(rowKeys, 'education', 'qualification', 'degree'),
      gender   : findColumn(rowKeys, 'gender', 'sex'),
      linkedin : findColumn(rowKeys, 'linkedin', 'linkedinurl', 'linkedinprofile'),
    };

    console.log('Column map:', cols);

    // ── 3. Parse & validate rows ──────────────────────────────────────────
    const validRows     = [];
    const mappingErrors = [];

    data.forEach((row, index) => {
      const rowNum = index + 2;
      try {
        const name     = getValue(row, cols.name).trim();
        const email    = getValue(row, cols.email).toLowerCase().trim();
        const position = getValue(row, cols.position).trim();
        const client   = getValue(row, cols.client).trim();

        if (!name || name.length < 2) {
          mappingErrors.push({ row: rowNum, candidate: name || 'Unknown', error: '"name" is required (min 2 chars)' });
          return;
        }
        if (!email || !email.includes('@')) {
          mappingErrors.push({ row: rowNum, candidate: name, error: '"email" must be valid' });
          return;
        }
        if (!position) {
          mappingErrors.push({ row: rowNum, candidate: name, error: '"position" is required' });
          return;
        }
        if (!client) {
          mappingErrors.push({ row: rowNum, candidate: name, error: '"client" is required — add a "Client" column to your Excel' });
          return;
        }

        const contactRaw = getValue(row, cols.contact).replace(/[^\d]/g, '');
        const contact    = contactRaw.length > 0 ? contactRaw : '0000000000';

        const skillsRaw = getValue(row, cols.skills);
        const skills    = skillsRaw
          ? skillsRaw.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
          : ['Not specified'];

        const statusRaw    = getValue(row, cols.status);
        const parsedStatus = statusRaw
          ? statusRaw.split(/[,;|]/).map(s => s.trim()).filter(s => VALID_STATUSES.includes(s))
          : [];
        const status = parsedStatus.length > 0 ? parsedStatus : ['Submitted'];

        validRows.push({
          rowNum,
          candidateData: {
            name, email, contact, position, client, skills, status,
            currentLocation   : getValue(row, cols.location)  || '',
            totalExperience   : getValue(row, cols.exp)        || '',
            relevantExperience: getValue(row, cols.relExp)     || '',
            ctc               : getValue(row, cols.ctc)        || '',
            ectc              : getValue(row, cols.ectc)       || '',
            noticePeriod      : getValue(row, cols.notice)     || '',
            remarks           : getValue(row, cols.remarks)    || '',
            source            : getValue(row, cols.source)     || 'Excel Import',
            currentCompany    : getValue(row, cols.company)    || '',
            education         : getValue(row, cols.education)  || '',
            gender            : getValue(row, cols.gender)     || '',
            linkedin          : getValue(row, cols.linkedin)   || '',
            recruiterId       : req.user._id,
            recruiterName     : req.user.name,
            active            : true,
            dateAdded         : new Date(),
          }
        });

      } catch (err) {
        console.error(`Row ${rowNum} parse error:`, err.message);
        mappingErrors.push({ row: rowNum, candidate: 'Unknown', error: `Parse error: ${err.message}` });
      }
    });

    console.log(`Validated: ${validRows.length} valid rows, ${mappingErrors.length} parse errors`);

    if (validRows.length === 0) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({
        success: false,
        message: 'No valid rows found.',
        errors : mappingErrors.slice(0, 20),
      });
    }

    // ── 4. Split into NEW vs EXISTING (by email) ──────────────────────────
    const allEmails    = validRows.map(r => r.candidateData.email);
    const existingDocs = await Candidate.find({ email: { $in: allEmails } }, { email: 1 });
    const existingSet  = new Set(existingDocs.map(d => d.email.toLowerCase()));

    const newRows    = validRows.filter(r => !existingSet.has(r.candidateData.email));
    const updateRows = validRows.filter(r =>  existingSet.has(r.candidateData.email));

    console.log(`New: ${newRows.length}, Existing to update: ${updateRows.length}`);

    // ── 5a. CREATE new candidates — SEQUENTIALLY to guarantee unique IDs ──
    //
    //  ★ WHY SEQUENTIAL?
    //    Promise.allSettled fires all saves at the same time.
    //    Each save's pre-hook reads the DB for the "last" ID — but since
    //    none of them have finished saving yet, they ALL read the same last ID
    //    and all try to save CAND-0203, causing 8 duplicate key errors.
    //
    //    Saving one-at-a-time means each save completes and writes its ID to DB
    //    before the next one reads the "last" ID, so each gets a unique number.
    //
    let createdCount = 0;

    if (newRows.length > 0) {
      // Read the real current max from DB ONCE before the loop
      let nextNum = await getNextCandidateNumber();
      console.log(`Starting candidateId from: CAND-${nextNum.toString().padStart(4, '0')}`);

      for (const row of newRows) {
        try {
          // Pre-assign the ID so the pre-save hook skips generation
          row.candidateData.candidateId = `CAND-${nextNum.toString().padStart(4, '0')}`;
          nextNum++; // increment BEFORE saving so the next iteration is ready

          const doc = new Candidate(row.candidateData);
          await doc.save(); // ← await each one before moving to the next
          createdCount++;
          console.log(`✓ Created ${row.candidateData.candidateId} — ${row.candidateData.name}`);
        } catch (err) {
          const msg = err.message || String(err);
          console.error(`✗ CREATE failed Row ${row.rowNum} (${row.candidateData.name}):`, msg);
          mappingErrors.push({ row: row.rowNum, candidate: row.candidateData.name, error: `Create failed: ${msg}` });
        }
      }
    }

    // ── 5b. UPDATE existing candidates (parallel is fine here) ───────────
    let updatedCount = 0;

    if (updateRows.length > 0) {
      const updateResults = await Promise.allSettled(
        updateRows.map(r => {
          const { recruiterId, recruiterName, dateAdded, candidateId, active, ...updateFields } = r.candidateData;

          // Drop empty strings/empty arrays so existing data isn't blanked
          const cleanFields = Object.fromEntries(
            Object.entries(updateFields).filter(([, v]) =>
              v !== '' && !(Array.isArray(v) && v.length === 0)
            )
          );

          return Candidate.findOneAndUpdate(
            { email: r.candidateData.email },
            { $set: cleanFields },
            { new: true, runValidators: false }
          );
        })
      );

      updateResults.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          updatedCount++;
          console.log(`✓ Updated — ${updateRows[idx].candidateData.name}`);
        } else {
          const msg  = result.reason?.message || 'Update failed';
          const name = updateRows[idx].candidateData.name;
          const rowN = updateRows[idx].rowNum;
          console.error(`✗ UPDATE failed Row ${rowN} (${name}):`, msg);
          mappingErrors.push({ row: rowN, candidate: name, error: `Update failed: ${msg}` });
        }
      });
    }

    // ── 6. Cleanup & respond ──────────────────────────────────────────────
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    const totalProcessed = createdCount + updatedCount;
    console.log(`=== DONE: ${createdCount} created, ${updatedCount} updated, ${mappingErrors.length} errors ===`);

    return res.status(200).json({
      success   : true,
      message   : `Import complete: ${createdCount} new candidate(s) added, ${updatedCount} existing updated.`,
      imported  : totalProcessed,
      created   : createdCount,
      updated   : updatedCount,
      duplicates: updatedCount,
      total     : data.length,
      errors    : mappingErrors.length > 0 ? mappingErrors.slice(0, 50) : undefined,
    });

  } catch (error) {
    console.error('BULK IMPORT CRITICAL ERROR:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (_) {}
    }
    return res.status(500).json({
      success: false,
      message: 'Critical server error during import.',
      error  : error.message,
    });
  }
};