import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const genderDetection = require('gender-detection');

const router = express.Router();

// --- Multer Config ---
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.mimetype === 'application/msword') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC and DOCX files are allowed!'), false);
        }
    }
});

// --- Helper Functions ---

const cleanText = (text) => {
    return text.replace(/\s+/g, ' ').trim();
};

const extractEmail = (text) => {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const matches = text.match(emailRegex);
    if (!matches) return '';
    return matches[0];
};

const extractPhone = (text) => {
    // 10 digit Indian mobile number
    const phoneRegex = /(?:\+91[\-\s]?)?[6789]\d{9}/g;
    const matches = text.match(phoneRegex);
    if (matches) {
        return matches[0].replace(/\D/g, '').slice(-10);
    }
    return '';
};

const extractLinkedIn = (text) => {
    const linkedInRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/gi;
    const matches = text.match(linkedInRegex);
    return matches ? matches[0] : '';
};

const extractDOB = (text) => {
    // Supported formats: dd-mm-yyyy, dd/mm/yyyy, yyyy-mm-dd
    const dobRegex = /\b(\d{2}[-/]\d{2}[-/]\d{4})|\b(\d{4}[-/]\d{2}[-/]\d{2})\b/g;
    const matches = text.match(dobRegex);
    if (matches) {
        let dob = matches[0];
        // Normalize to dd-mm-yyyy if yyyy-mm-dd
        if (/^\d{4}/.test(dob)) {
            const parts = dob.split(/[-/]/);
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dob.replace(/\//g, '-');
    }
    return '';
};

const extractLocation = (text) => {
    const cities = [
        'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
        'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
        'Bhopal', 'Visakhapatnam', 'Pimpri', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
        'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar',
        'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah',
        'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur',
        'Kota', 'Chandigarh', 'Guwahati', 'Noida', 'Gurugram', 'Gurgaon'
    ];

    for (const city of cities) {
        if (new RegExp(`\\b${city}\\b`, 'i').test(text)) {
            return city;
        }
    }
    return '';
};

// --- Advanced Name Extraction & Scoring ---
const nlp = require('compromise');

const extractNameAdvanced = (text) => {
    // 1. NER Extraction using compromise
    const doc = nlp(text);
    const people = doc.people().out('array');
    const orgs = doc.organizations().out('array');

    // 2. Candidate Parsing & Scoring
    const candidates = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Analyze first 30 lines for potential names (NER + Heuristic Fallback)
    const linesToScan = lines.slice(0, 30);

    linesToScan.forEach((line, index) => {
        // Skip common junk
        if (/@/.test(line) || /\d{10}/.test(line) || /http/.test(line)) return;
        if (/resume|curriculum|vitae|bio|profile|summary|objective|experience|education|skills|contact/i.test(line)) return;

        // Potential Name Candidates
        let score = 0;
        const words = line.split(/\s+/);

        // Strict Validation: 2-4 words, mostly alpha
        if (words.length < 2 || words.length > 4) return;
        if (!/^[A-Za-z\.\s]+$/.test(line)) return;

        // Scoring Rules

        // Rule: Is it a detected PERSON entity?
        const isPersonEntity = people.some(p => line.toLowerCase().includes(p.toLowerCase()));
        if (isPersonEntity) score += 5;

        // Rule: Is it a detected ORG entity? (Negative Filter)
        const isOrgEntity = orgs.some(o => line.toLowerCase().includes(o.toLowerCase()));
        if (isOrgEntity) score -= 10;

        // Rule: Contains Company Keywords? (Negative Filter)
        if (/Pvt|Ltd|Limited|Solutions|Technologies|Company|Corp|Inc|LLC|Group|Trust/i.test(line)) score -= 10;

        // Rule: Position (Top is better)
        if (index < 5) score += 5;
        else if (index < 10) score += 3;
        else if (index < 25) score += 1; // Slight boost for later lines if valid

        // Rule: Capitalization (Title Case or ALL CAPS)
        if (/^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/.test(line)) score += 2; // Title Case
        if (/^[A-Z\s]+$/.test(line)) score += 2; // ALL CAPS

        // Rule: Context (Near Email/Phone is good)
        // Find email/phone index relative to this line
        // (Simplified check: if email is in next few lines)
        const nearbyText = linesToScan.slice(Math.max(0, index - 2), Math.min(linesToScan.length, index + 5)).join(' ');
        if (/@/.test(nearbyText) || /\d{10}/.test(nearbyText)) score += 3;

        if (score > 0) {
            candidates.push({ name: line, score });
        }
    });

    // 3. Select Best Candidate
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
        console.log('Top Name Candidates:', candidates.slice(0, 3));
        return candidates[0].name;
    }

    return '';
};

// --- Gender Prediction Helper ---
const predictGender = (fullName) => {
    if (!fullName) return '';
    const firstName = fullName.split(' ')[0].trim();

    // 1. Local Dataset Lookup
    // In a real app, this should be a larger JSON file loaded once
    const indianNames = {
        "Ravi": "Male", "Anjali": "Female", "Rahul": "Male", "Priya": "Female",
        "Amit": "Male", "Sneha": "Female", "Vijay": "Male", "Pooja": "Female",
        "Arun": "Male", "Divya": "Female", "Karan": "Male", "Neha": "Female",
        "Varun": "Male", "Sania": "Female", "Rohit": "Male", "Kavya": "Female"
        // Add more common names here...
    };

    // Case-insensitive check
    const gender = Object.keys(indianNames).find(key => key.toLowerCase() === firstName.toLowerCase());
    if (gender) return indianNames[gender];

    // 2. Library Fallback (gender-detection)
    try {
        const predicted = genderDetection.detect(firstName);
        if (predicted === 'male') return 'Male';
        if (predicted === 'female') return 'Female';
    } catch (e) {
        // limit logging
    }

    return ''; // Unknown/Blank
};

const extractSkills = (text) => {
    // Common tech skills to look for
    const commonSkills = [
        'Java', 'Python', 'C++', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Express',
        'HTML', 'CSS', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Docker', 'Kubernetes',
        'Git', 'Jenkins', 'Linux', 'Agile', 'Scrum', 'Rest API', 'GraphQL', 'Machine Learning', 'AI',
        'Data Analysis', 'Excel', 'Power BI', 'Tableau', 'Communication', 'Teamwork', 'Problem Solving'
    ];

    // Find all matching skills in the text (case insensitive)
    const foundSkills = commonSkills.filter(skill =>
        new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
    );

    // Return unique found skills as a comma-separated string
    return [...new Set(foundSkills)].join(', ');
};


// --- Education Extraction ---
const extractHighestQualification = (text) => {
    // Rank degrees: Higher number = Higher Qualification
    const degrees = [
        { name: 'Ph.D', regex: /\b(Ph\.?D|Doctorate)\b/i, rank: 5 },
        { name: 'M.Tech', regex: /\b(M\.?Tech|Master of Technology)\b/i, rank: 4 },
        { name: 'MCA', regex: /\b(MCA|Master of Computer Applications)\b/i, rank: 4 },
        { name: 'MBA', regex: /\b(MBA|Master of Business Administration)\b/i, rank: 4 },
        { name: 'M.Sc', regex: /\b(M\.?Sc|Master of Science)\b/i, rank: 4 },
        { name: 'M.E', regex: /\b(M\.?E|Master of Engineering)\b/i, rank: 4 },
        { name: 'B.Tech', regex: /\b(B\.?Tech|Bachelor of Technology)\b/i, rank: 3 },
        { name: 'B.E', regex: /\b(B\.?E|Bachelor of Engineering)\b/i, rank: 3 },
        { name: 'BCA', regex: /\b(BCA|Bachelor of Computer Applications)\b/i, rank: 3 },
        { name: 'B.Sc', regex: /\b(B\.?Sc|Bachelor of Science)\b/i, rank: 3 },
        { name: 'B.Com', regex: /\b(B\.?Com)\b/i, rank: 3 },
        { name: 'BBA', regex: /\b(BBA)\b/i, rank: 3 },
        { name: 'Diploma', regex: /\b(Diploma|Polytechnic)\b/i, rank: 2 },
        { name: '12th', regex: /\b(Class 12|XII|HSC|Intermediate)\b/i, rank: 1 },
        { name: '10th', regex: /\b(Class 10|X|SSC|Matriculation)\b/i, rank: 1 }
    ];

    let highestRank = 0;
    let highestDegree = '';

    degrees.forEach(degree => {
        if (degree.regex.test(text)) {
            if (degree.rank > highestRank) {
                highestRank = degree.rank;
                highestDegree = degree.name;
            }
        }
    });

    return highestDegree;
};


// --- Parse File Handler ---

router.post('/parse', upload.single('resume'), async (req, res) => {
    console.log('Resume parse request received');
    try {
        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ status: false, message: 'No file uploaded' });
        }

        console.log('File uploaded:', req.file);
        const filePath = req.file.path;
        let text = '';

        // 1. Extract Text
        try {
            if (req.file.mimetype === 'application/pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                console.log('PDF buffer read, parsing with pdf-parse v2...');

                // NEW usage for pdf-parse v2
                const parser = new PDFParse({ data: dataBuffer });
                const data = await parser.getText();
                text = data.text;
                await parser.destroy();

                console.log('PDF parsed successfully, text length:', text.length);
            } else if (req.file.mimetype.includes('wordprocessingml') || req.file.mimetype.includes('msword')) {
                console.log('DOCX file detected, extracting text...');
                const result = await mammoth.extractRawText({ path: filePath });
                text = result.value;
                console.log('DOCX extracted successfully, text length:', text.length);
            }
        } catch (parseError) {
            console.error('Text extraction failed:', parseError);
            throw new Error('Failed to extract text from file: ' + parseError.message);
        }

        // Clean up file
        try {
            fs.unlinkSync(filePath);
        } catch (unlinkError) {
            console.warn('Failed to delete temp file:', unlinkError);
        }

        if (!text) {
            return res.status(500).json({ status: false, message: 'Could not extract text or file is empty' });
        }

        // 2. Parse Details
        const resumeText = cleanText(text); // Cleaned version for regex
        const rawText = text; // Keep raw for line-by-line

        // Use Advanced Logic
        // Use Advanced Logic
        const fullName = extractNameAdvanced(rawText);
        const email = extractEmail(resumeText);
        const phone = extractPhone(resumeText);
        const dob = extractDOB(resumeText);
        const linkedin = extractLinkedIn(resumeText);
        const currentLocation = extractLocation(resumeText);
        const skills = extractSkills(resumeText);
        const education = extractHighestQualification(resumeText); // NEW

        // 3. Gender Prediction (Name-Based Only)
        // If name found, predict. Else empty.
        const gender = predictGender(fullName);

        console.log('Extracted Data:', { fullName, email, phone, dob, linkedin, currentLocation, education, skills, gender });

        // 4. Return JSON
        res.json({
            fullName: fullName || '',
            email: email || '',
            phone: phone || '',
            dob: dob || '',
            gender: gender || '',
            linkedin: linkedin || '',
            currentLocation: currentLocation || '',
            education: education || '', // Return highest qualification
            skills: skills || ''
        });

    } catch (error) {
        console.error('Resume Parse Error (Top Level):', error);
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        res.status(500).json({ status: false, error: 'Server Error: ' + error.message });
    }
});

export default router;
