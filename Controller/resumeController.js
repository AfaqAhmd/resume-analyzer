// Controller/resumeController.js
const axios = require("axios");

require("dotenv").config();

const Resume = require("../DB/resumeModel");
const pdfParse = require("pdf-parse");


// 1) Save resume text ONLY (no AI here)
async function saveResume(req, res) {
  try {
    const { email, resumeText } = req.body;

    if (!email || !resumeText) {
      return res
        .status(400)
        .send({ message: "email and resumeText are required" });
    }

    // sirf DB me upsert
    const doc = await Resume.findOneAndUpdate(
      { email },
      {
        email,
        originalText: resumeText,
      },
      { upsert: true, new: true }
    );

    return res.status(200).send({
      message: "Resume saved successfully",
      resume: doc,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      message: "Server error while saving resume",
      error: err.message,
    });
  }
}


// 2) Compare saved resume with a job description + save AI result
async function analyzeJobWithResume(req, res) {
  try {
    const { email, jobDescription, company, position } = req.body;

    if (!email || !jobDescription) {
      return res
        .status(400)
        .send({ message: "email and jobDescription are required" });
    }

    // fetch saved resume from DB
    const resume = await Resume.findOne({ email });
    if (!resume) {
      return res.status(404).send({
        message: "No resume found for this email. Upload resume first.",
      });
    }

    const prompt = `
You are a job-resume matching engine.

Compare this RESUME and JOB DESCRIPTION and return STRICT JSON ONLY:

{
  "matchScore": number,           // 0-100 how well resume fits this job
  "missingSkills": [ "string", ... ],
  "recommendedKeywords": [ "string", ... ],
  "summary": "short explanation (2-3 lines)"
}

RESUME:
${resume.originalText}

JOB DESCRIPTION:
${jobDescription}

Company: ${company || "N/A"}
Position: ${position || "N/A"}
`;

    const GEMINI_API_KEY = process.env.GEMINI_KEY;
    const GEMINI_MODEL = "gemini-2.5-flash";

    if (!GEMINI_API_KEY) {
      return res
        .status(500)
        .send({ message: "GEMINI_KEY not set in .env file" });
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const aiResponse = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
    });

    const rawText =
      aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let jsonString = rawText.trim();
    if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/^```json\s*/i, "");
      jsonString = jsonString.replace(/^```/, "");
      jsonString = jsonString.replace(/```$/, "").trim();
    }

    let aiResult;
    try {
      aiResult = JSON.parse(jsonString);
    } catch (err) {
      console.error("AI JSON parse error:", rawText);
      console.error("After cleaning:", jsonString);
      return res.status(500).send({
        message: "Failed to parse AI response",
        raw: rawText,
        cleaned: jsonString,
      });
    }

    // yahan AI result ko DB me bhi store karte hain
    const updated = await Resume.findOneAndUpdate(
      { email },
      {
        lastMatchScore: aiResult.matchScore || 0,
        lastMissingSkills: aiResult.missingSkills || [],
        lastRecommendedKeywords: aiResult.recommendedKeywords || [],
        lastSummary: aiResult.summary || "",
      },
      { new: true }
    );

    return res.status(200).send({
      message: "Job vs resume analysis completed",
      ai: aiResult,
      resume: updated,
    });
  } catch (err) {
    console.error(
      "AI error:",
      err?.response?.status,
      err?.response?.data || err.message
    );
    console.error(err);
    return res.status(500).send({
      message: "Server error while analyzing job",
      error: err.message,
    });
  }
}


// 3) Upload PDF, extract text, phir sirf save karo (no AI here)
async function uploadResumePdf(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .send({ message: "email is required in form-data" });
    }

    if (!req.file) {
      return res
        .status(400)
        .send({ message: "resumePdf file is required" });
    }

    if (
      req.file.mimetype !== "application/pdf" &&
      !req.file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      return res
        .status(400)
        .send({ message: "Only PDF files are allowed" });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = (pdfData.text || "").trim();

    if (!resumeText) {
      return res.status(400).send({
        message: "Could not extract text from PDF, check the file content.",
      });
    }

    // yahan se sirf saveResume ko bhejdo, jo ab sirf DB save karega
    const fakeReq = { body: { email, resumeText } };
    return saveResume(fakeReq, res);
  } catch (err) {
    console.error("PDF upload error:", err);
    return res.status(500).send({
      message: "Server error while uploading resume",
      error: err.message,
    });
  }
}








// 4) Check if resume exists + last job analysis info
async function getResumeStatus(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send({ message: "email is required" });
    }

    const resume = await Resume.findOne({ email });

    if (!resume) {
      return res
        .status(404)
        .send({ hasResume: false, message: "No resume found" });
    }

    return res.status(200).send({
      hasResume: true,
      email: resume.email,
      updatedAt: resume.updatedAt || resume.createdAt,
      lastMatchScore: resume.lastMatchScore || 0,
      lastMissingSkills: resume.lastMissingSkills || [],
      lastRecommendedKeywords: resume.lastRecommendedKeywords || [],
      lastSummary: resume.lastSummary || "",
    });
  } catch (err) {
    console.error("getResumeStatus error:", err);
    return res.status(500).send({
      message: "Server error while checking resume status",
      error: err.message,
    });
  }
}



// -------------


module.exports = { saveResume, analyzeJobWithResume, uploadResumePdf, getResumeStatus };
