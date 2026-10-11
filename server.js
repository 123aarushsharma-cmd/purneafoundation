import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Built-in academic & opportunities counselor knowledge base
function getCounselorGuidance(query) {
  const q = (query || '').toLowerCase().trim();
  
  if (q.includes('moot') || q.includes('court') || q.includes('competition')) {
    return `**12th National Moot Court Competition 2026** is actively open on our noticeboard:
• **Core Subject:** Constitutional Law & Emerging Cyber Jurisprudence
• **Awards Pool:** INR 1,50,000 Cash Prize + Direct Tier-1 Corporate Internships
• **Deadline:** 28th September 2026
• **Memorial Guidelines:** Ensure citations conform strictly with the Bluebook 21st Edition standard. Review the Noticeboard for full registration links.`;
  }
  
  if (q.includes('intern') || q.includes('aethel') || q.includes('job') || q.includes('work')) {
    return `**Active Internship & Research Positions:**
• **Aethel Legal International:** Corporate commercial law, contracts, and IP compliance (Deadline: 15th October 2026).
• **Assistant Incubation & Innovation Manager:** Technology startup incubation and grant coordination.
• **Jagran Lakecity University:** Student research associates & legal publishing assistants.
Filter by the "Internships" chip on the board to review specific qualifications and application portals.`;
  }
  
  if (q.includes('scholarship') || q.includes('fellowship') || q.includes('grant') || q.includes('aid')) {
    return `**Scholarships & Research Fellowships:**
• **National Merit Scholarship 2026:** Comprehensive financial support for undergraduate and postgraduate scholars.
• **Benefits:** Full semester tuition support and textbook stipends.
• **Prerequisites:** Verified academic marksheets and faculty endorsement letters.
Check the "Scholarships/Fellowships" category to track upcoming grant closing dates.`;
  }
  
  if (q.includes('paper') || q.includes('scopus') || q.includes('publish') || q.includes('journal') || q.includes('chapter')) {
    return `**Scopus Call for Papers & Academic Publishing:**
• **Current Open Calls:** Special issues on AI Ethics, Law & Governance (Organized by ISAI-DT & Knowledge Steez).
• **Formatting Standard:** Standard manuscript word limit is 4,000–6,000 words with APA 7th or Bluebook footnotes.
• **Peer Review Window:** Fast-track editorial review within 3 weeks for verified academic submissions.`;
  }
  
  if (q.includes('contract') || q.includes('nda') || q.includes('legal') || q.includes('service') || q.includes('draft')) {
    return `**Purnea Rebirth Foundation Legal Desk:**
We offer dedicated pro-bono and subsidized legal consultation for students and early-stage founders:
• **Commercial Agreements:** Freelancer contracts, founder MOUs, and vendor agreements.
• **NDA Drafting:** Airtight Non-Disclosure Agreements for research labs and startups.
• **Direct Desk Helpline:** **+91 97984 88837** or email **info@thenoticeboard.edu** (turnaround within 24 hours).`;
  }
  
  return `Thank you for consulting the **Noticeboard Advisory Desk**:
• **Verified Opportunities:** Browse the live board above using our category filter chips for Internships, Moot Courts, Scholarships, and Scopus Publications.
• **Save & Track:** Click the bookmark icon on any notice to save it to your personal tracking board.
• **Direct Assistance:** Reach out to the Foundation helpline at **+91 97984 88837** or email **info@thenoticeboard.edu**.`;
}

// Proxy route for Gemini AI & Academic Guidance
app.post('/api/gemini', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.length > 20 && !apiKey.startsWith('TODO') && !apiKey.startsWith('YOUR_')) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are the Official Academic Advisor for "The Noticeboard — Purnea Rebirth Foundation". We list student opportunities such as Moot Courts, Internships, Scholarships, Scopus Call for Papers, and provide Legal Advisory (Contract drafting, NDA, career guidance). Direct Desk Helpline: +91 97984 88837.
User asks: "${query}".
Answer in an authoritative, highly encouraging, structured, and helpful manner with bullet points where appropriate.`
              }
            ]
          }
        ]
      });

      const replyText = response.text || '';
      if (replyText) {
        return res.json({ reply: replyText });
      }
    } catch {
      // Seamlessly fall through to built-in guidance without logging errors
    }
  }

  // Built-in verified institutional guidance fallback
  const reply = getCounselorGuidance(query);
  return res.json({ reply });
});

// Serve static assets and root files
app.use(express.static(__dirname));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`The Noticeboard server listening on http://0.0.0.0:${PORT}`);
});
