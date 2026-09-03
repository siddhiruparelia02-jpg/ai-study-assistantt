import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createRequire } from 'module';
import {
  generateTutorResponse,
  generateAskNotesResponse,
  generateQuiz,
  generateFlashcards,
  generateNotes,
  generateStudyRecommendations,
  generateStudyPlan,
} from './server/aiService';
import { aiTelemetry } from './server/aiConfig';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: { contents: any; config?: any }
) {
  // Ordered from fastest/most available to standard preview models
  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.7-flash',
  ];
  let lastError: any = null;

  for (const model of candidateModels) {
    // Retry up to 2 times per candidate model on transient 503 / 429 errors
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('overloaded');

        if (isTransient && attempt === 0) {
          // Wait briefly with backoff before retry
          await delay(600);
          continue;
        }
        // Move to next candidate model
        break;
      }
    }
  }

  throw lastError || new Error('All model attempts failed');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
  });

  // Centralized AI Internal Telemetry & Metrics endpoint
  app.get('/api/ai/telemetry', (req, res) => {
    res.json({ success: true, data: aiTelemetry.getMetricsSummary() });
  });

  // Real Document Processing & Text Extraction Endpoint
  app.post('/api/materials/process', async (req, res) => {
    try {
      const {
        fileBase64,
        fileText,
        fileType = 'PDF',
        fileName = 'document.pdf',
        subject = 'General',
        topic = '',
      } = req.body;

      let extractedText = '';
      let pageCount = 1;

      const lowerName = fileName.toLowerCase();
      const isPdf =
        lowerName.endsWith('.pdf') ||
        fileType === 'application/pdf' ||
        fileType === 'PDF' ||
        (fileBase64 && fileBase64.startsWith('data:application/pdf'));

      // If client already provided clean text (for TXT, Markdown, CSV)
      if (fileText && typeof fileText === 'string' && fileText.trim().length > 0) {
        extractedText = fileText.trim();
      } else if (isPdf && fileBase64) {
        // Step 1: Strip optional data URL prefix
        const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, '').trim();
        const buffer = Buffer.from(cleanBase64, 'base64');

        // Step 2: Use pdf-parse for fast local extraction
        try {
          const pdfData = await pdfParse(buffer);
          if (pdfData && pdfData.text) {
            extractedText = pdfData.text.trim();
            pageCount = pdfData.numpages || 1;
          }
        } catch (pdfErr: any) {
          console.warn('pdf-parse local parsing warning:', pdfErr.message || pdfErr);
        }

        // Step 3: If pdf-parse returned minimal text (e.g. scanned doc or complex layout), use Gemini multimodal with fallback
        if (!extractedText || extractedText.length < 50) {
          try {
            const ai = getGeminiClient();
            const response = await generateContentWithFallback(ai, {
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'application/pdf',
                        data: cleanBase64,
                      },
                    },
                    {
                      text: `Extract all textual contents, chapter titles, definitions, code blocks, and formulas from this academic study document (${fileName}) for ${subject}. Return the full structured text.`,
                    },
                  ],
                },
              ],
            });
            if (response && response.text) {
              extractedText = response.text.trim();
            }
          } catch (geminiPdfErr) {
            console.warn('Gemini multimodal PDF extraction notice:', geminiPdfErr);
          }
        }
      } else if (fileBase64) {
        // Non-PDF base64 (e.g. text or markdown encoded as base64)
        try {
          const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '').trim();
          const buffer = Buffer.from(cleanBase64, 'base64');
          extractedText = buffer.toString('utf-8');
        } catch (decodeErr) {
          console.warn('Base64 text decode warning:', decodeErr);
        }
      }

      if (!extractedText || extractedText.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error:
            'Could not extract text from this document. Please ensure the file is not empty or password protected.',
        });
      }

      // Generate structured summary snippet & key topics using Gemini
      let summarySnippet = '';
      let keyTopics: string[] = [];

      try {
        const ai = getGeminiClient();
        const summaryPrompt = `You are an academic content indexer.
Document Title: ${fileName}
Subject: ${subject}
Topic context: ${topic || 'General'}

Extracted Text Excerpt (first 6000 chars):
"""
${extractedText.slice(0, 6000)}
"""

Tasks:
1. Provide a clear, high-yield 2-sentence summary snippet of the key topics, syllabus concepts, and principles covered in this material.
2. Identify 3 to 5 core topics or conceptual units covered.

Return JSON adhering to this schema:
{
  "summarySnippet": "...",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"]
}`;

        const sumRes = await generateContentWithFallback(ai, {
          contents: summaryPrompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        if (sumRes && sumRes.text) {
          const parsed = JSON.parse(sumRes.text);
          summarySnippet = parsed.summarySnippet || '';
          keyTopics = Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [];
        }
      } catch (sumErr) {
        console.warn('AI summary generator notice:', sumErr);
        summarySnippet = `Study document covering ${topic || fileName}. Contains ${extractedText.split(/\s+/).length} words and key revision concepts.`;
        keyTopics = [subject, topic || 'Key Concepts', 'Study Material'].filter(Boolean);
      }

      return res.json({
        success: true,
        data: {
          extractedText,
          summarySnippet,
          keyTopics,
          pageCount,
        },
      });
    } catch (err: any) {
      console.error('Error in /api/materials/process:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to process and index document.',
      });
    }
  });

  // AI Tutor Endpoint (Centralized Pedagogical Service)
  app.post('/api/tutor/chat', async (req, res) => {
    try {
      const { question, subject, difficulty = 'Beginner', history = [] } = req.body;

      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: 'Question or topic is required' });
      }

      const tutorData = await generateTutorResponse({
        question,
        subject,
        difficulty,
        history,
      });

      return res.json({
        success: true,
        data: tutorData,
      });
    } catch (error: any) {
      console.error('Error in /api/tutor/chat:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error in AI Tutor',
      });
    }
  });

  // AI Quiz Generator Endpoint (Centralized & Quality-Validated Service)
  app.post('/api/quiz/generate', async (req, res) => {
    try {
      const quizResult = await generateQuiz(req.body);
      return res.json({
        success: true,
        data: quizResult,
      });
    } catch (error: any) {
      console.error('Error in /api/quiz/generate:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error in Quiz generation',
      });
    }
  });

  // AI Flashcard Generator Endpoint (Centralized & Pedagogically Structured Service)
  app.post('/api/flashcards/generate', async (req, res) => {
    try {
      const flashcardResult = await generateFlashcards(req.body);
      return res.json({
        success: true,
        data: flashcardResult,
      });
    } catch (error: any) {
      console.error('Error in /api/flashcards/generate:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error in Flashcard generation',
      });
    }
  });

  // AI Notes Generator & Refinement Endpoint (Centralized Academic Synthesis Service)
  app.post('/api/notes/generate', async (req, res) => {
    try {
      const noteResult = await generateNotes(req.body);
      return res.json({
        success: true,
        data: noteResult,
      });
    } catch (error: any) {
      console.error('Error in /api/notes/generate:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error in Note generation',
      });
    }
  });

  // Document-Grounded "Ask My Notes" Endpoint (Centralized Grounded RAG Service)
  app.post('/api/notes/ask', async (req, res) => {
    try {
      const askResult = await generateAskNotesResponse(req.body);
      return res.json({
        success: true,
        data: askResult,
      });
    } catch (err: any) {
      console.error('Error in /api/notes/ask:', err);
      return res.status(500).json({
        error: 'Failed to process question against study material: ' + err.message,
      });
    }
  });

  // Adaptive Study Recommendations Endpoint
  app.post('/api/recommendations/generate', async (req, res) => {
    try {
      const { weakTopics = [], subject = 'ALL' } = req.body;

      if (!Array.isArray(weakTopics) || weakTopics.length === 0) {
        return res.json({
          success: true,
          data: {
            title: 'Great Study Progress',
            strugglingWith: 'No critical weak topics identified yet.',
            whyDifficult: 'You currently have strong scores or haven’t taken enough quizzes/flashcards to flag weak areas.',
            whatToDoNext: 'Complete a diagnostic quiz or review flashcards across your subjects to reveal target review areas.',
            recommendedActivity: 'Take a mixed diagnostic quiz to baseline your knowledge.',
            primaryTopic: 'General Review',
            primarySubject: subject !== 'ALL' ? subject : 'JAVA',
            actionType: 'quiz',
            estimatedTimeMinutes: 10,
          },
        });
      }

      // Find highest priority weak topic
      const highPriorityTopics = weakTopics.filter((t: any) => t.priority === 'HIGH');
      const targetTopic = highPriorityTopics[0] || weakTopics[0];

      let ai: GoogleGenAI | null = null;
      try {
        ai = getGeminiClient();
      } catch (err: any) {
        console.warn('Gemini client not initialized for recommendations:', err.message);
      }

      const systemInstruction = `You are an academic learning coach and adaptive study advisor for university students.
Your job is to examine the student's actual quiz and flashcard performance metrics to provide a concise, highly actionable "Recommended Next Step".

Directives:
1. Identify specifically what the student is struggling with based on the data.
2. Explain why it may be difficult based on their quiz mistakes, accuracy percentage, and flashcard mastery.
3. Provide a clear, immediate study instruction on what the student should do next.
4. Recommend a concrete practice activity (e.g., a 5-question quiz drill, reviewing flashcards, or asking the AI Tutor to break down the concept).
5. Strict constraint: Keep the recommendation concise, professional, encouraging, and actionable. Do NOT diagnose learning disabilities or make unsupported psychological claims.
6. Return structured JSON matching the schema.`;

      const prompt = `Student Performance Summary:
Course Filter: ${subject}
Top Weak Topics:
${JSON.stringify(weakTopics.slice(0, 5), null, 2)}

Target Focus Topic:
${JSON.stringify(targetTopic, null, 2)}

Generate a personalized "Recommended Next Step" for this student.`;

      if (ai) {
        try {
          const response = await generateContentWithFallback(ai, {
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Short headline for this recommendation (e.g. Focus on Java Constructor Chaining)',
                  },
                  strugglingWith: {
                    type: Type.STRING,
                    description: 'Specific concept or sub-topic the student is struggling with',
                  },
                  whyDifficult: {
                    type: Type.STRING,
                    description: 'Why this concept is tricky based on their actual performance metrics',
                  },
                  whatToDoNext: {
                    type: Type.STRING,
                    description: 'Concrete immediate action the student should take',
                  },
                  recommendedActivity: {
                    type: Type.STRING,
                    description: 'Targeted practice task (e.g. Complete 5 practice questions or review flashcards)',
                  },
                  primaryTopic: {
                    type: Type.STRING,
                    description: 'The exact topic name to target',
                  },
                  primarySubject: {
                    type: Type.STRING,
                    description: 'The subject code (e.g. JAVA, CS301, CHEM202)',
                  },
                  actionType: {
                    type: Type.STRING,
                    enum: ['tutor', 'quiz', 'flashcards', 'notes'],
                    description: 'The best modality for this review',
                  },
                  estimatedTimeMinutes: {
                    type: Type.INTEGER,
                    description: 'Estimated minutes to complete (e.g. 10)',
                  },
                },
                required: [
                  'title',
                  'strugglingWith',
                  'whyDifficult',
                  'whatToDoNext',
                  'recommendedActivity',
                  'primaryTopic',
                  'primarySubject',
                  'actionType',
                ],
              },
            },
          });

          const resText = response.text;
          if (resText) {
            let parsed = null;
            try {
              parsed = JSON.parse(resText);
            } catch {
              const match = resText.match(/\{[\s\S]*\}/);
              if (match) parsed = JSON.parse(match[0]);
            }

            if (parsed && parsed.strugglingWith && parsed.whatToDoNext) {
              return res.json({
                success: true,
                data: parsed,
              });
            }
          }
        } catch (apiErr: any) {
          console.warn('Gemini recommendation API error, engaging algorithmic fallback:', apiErr.message);
        }
      }

      // Algorithmic Fallback based on real performance data
      const topicName = targetTopic.topic || targetTopic.topicName || 'Core Fundamentals';
      const subjCode = targetTopic.subjectCode || 'JAVA';
      const score = targetTopic.averageQuizScore ?? targetTopic.accuracyRate ?? 45;
      const flashcardPct = targetTopic.flashcardMasteryPercent ?? 40;
      const incorrectCount = targetTopic.quizIncorrectAnswers ?? 5;
      const totalQ = targetTopic.quizTotalQuestions ?? 10;
      const needReview = targetTopic.flashcardsNeedingReview ?? 4;

      let reasonDetail = `Your average quiz accuracy is ${score}% (with ${incorrectCount} incorrect answers across recent questions) and flashcard mastery is ${flashcardPct}%.`;
      if (targetTopic.reason) {
        reasonDetail = targetTopic.reason;
      }

      const fallbackRec = {
        title: `Target Review: ${topicName}`,
        strugglingWith: `${topicName} fundamentals and execution rules in ${subjCode}.`,
        whyDifficult: `${reasonDetail} Key mechanisms like runtime dispatch and edge cases frequently cause mistakes under exam conditions.`,
        whatToDoNext: score < 50
          ? `Review the lecture notes in 'Ask My Notes' to clarify foundational rules before testing again.`
          : `Review the ${needReview} flashcards marked for revision to solidify core definitions.`,
        recommendedActivity: score < 50
          ? `Ask AI Tutor to break down ${topicName} with step-by-step code tracing.`
          : `Complete a 5-question Practice Quiz on ${topicName} to reach >75% accuracy.`,
        primaryTopic: topicName,
        primarySubject: subjCode,
        actionType: score < 50 ? 'tutor' : 'quiz',
        estimatedTimeMinutes: 10,
      };

      return res.json({
        success: true,
        data: fallbackRec,
      });
    } catch (err: any) {
      console.error('Error in /api/recommendations/generate:', err);
      return res.status(500).json({
        error: 'Failed to generate study recommendations: ' + err.message,
      });
    }
  });

  /* =========================================================================
     ADAPTIVE STUDY PLANNER API
     ========================================================================= */
  app.post('/api/planner/generate', async (req, res) => {
    try {
      const {
        preferences,
        subjects = [],
        weakTopics = [],
        quizHistory = [],
        flashcardMastery = [],
        recentActivity = [],
        userMaterials = [],
        userId,
      } = req.body || {};

      const dailyMinutes = Number(preferences?.dailyStudyMinutes) || 120;
      const sessionLength = Number(preferences?.sessionLengthMinutes) || 45;
      const studyDays = Array.isArray(preferences?.studyDays) && preferences.studyDays.length > 0
        ? preferences.studyDays
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      const today = new Date();
      const startDateStr = preferences?.startDate || today.toISOString().split('T')[0];
      
      // Calculate end date (default 7-14 days horizon)
      let endDateStr = preferences?.endDate;
      if (!endDateStr) {
        const end = new Date(startDateStr);
        end.setDate(end.getDate() + 7);
        endDateStr = end.toISOString().split('T')[0];
      }

      // Step 1: Calculate Real Priority for each subject based on actual data
      const nowMs = new Date(startDateStr).getTime();
      const prioritySubjects = subjects.map((subj: any, index: number) => {
        let isExamPassed = false;
        let daysUntilExam = 999;

        if (subj.examDate) {
          const examMs = new Date(subj.examDate).getTime();
          const diffDays = Math.ceil((examMs - nowMs) / (1000 * 60 * 60 * 24));
          daysUntilExam = diffDays;
          if (diffDays < 0) {
            isExamPassed = true;
          }
        }

        // Gather real topic performance for this subject
        const subjWeakTopics = weakTopics.filter((w: any) => w.subjectCode === subj.code);
        const subjQuizzes = quizHistory.filter((q: any) => q.subjectCode === subj.code);
        const subjFlashcards = flashcardMastery.filter((f: any) => f.subjectCode === subj.code);

        let avgQuizScore: number | null = null;
        if (subjQuizzes.length > 0) {
          const totalScore = subjQuizzes.reduce((acc: number, q: any) => acc + (Number(q.scorePercent) || 0), 0);
          avgQuizScore = Math.round(totalScore / subjQuizzes.length);
        } else if (subjWeakTopics.some((w: any) => w.averageQuizScore !== null && w.averageQuizScore !== undefined)) {
          const scored = subjWeakTopics.filter((w: any) => w.averageQuizScore !== null && w.averageQuizScore !== undefined);
          const sum = scored.reduce((acc: number, w: any) => acc + Number(w.averageQuizScore), 0);
          avgQuizScore = Math.round(sum / scored.length);
        }

        let flashMastery: number | null = null;
        if (subjFlashcards.length > 0) {
          const sum = subjFlashcards.reduce((acc: number, f: any) => acc + (Number(f.masteryPercent) || 0), 0);
          flashMastery = Math.round(sum / subjFlashcards.length);
        }

        // Priority Score Calculation
        let priorityScore = 0;
        let reasonParts: string[] = [];

        if (isExamPassed) {
          priorityScore = 0;
          reasonParts.push('Exam has passed');
        } else {
          // 1. Exam proximity
          if (daysUntilExam <= 7) {
            priorityScore += 45;
            reasonParts.push(`Exam in ${daysUntilExam} days (Urgent)`);
          } else if (daysUntilExam <= 14) {
            priorityScore += 35;
            reasonParts.push(`Exam in ${daysUntilExam} days`);
          } else if (daysUntilExam <= 30) {
            priorityScore += 25;
            reasonParts.push(`Exam in ${daysUntilExam} days`);
          } else if (daysUntilExam <= 90) {
            priorityScore += 15;
          } else {
            priorityScore += 10;
          }

          // 2. Weak Quiz performance
          if (avgQuizScore !== null) {
            if (avgQuizScore < 60) {
              priorityScore += 30;
              reasonParts.push(`Low quiz accuracy (${avgQuizScore}%)`);
            } else if (avgQuizScore < 75) {
              priorityScore += 18;
              reasonParts.push(`Moderate quiz accuracy (${avgQuizScore}%)`);
            } else {
              priorityScore += 5;
            }
          }

          // 3. Weak topics count
          if (subjWeakTopics.length > 0) {
            priorityScore += Math.min(25, subjWeakTopics.length * 8);
            reasonParts.push(`${subjWeakTopics.length} weak topic(s) needing review`);
          }

          // 4. Low completion / Unfinished syllabus
          const progress = Number(subj.progressPercent) || 0;
          if (progress < 25) {
            priorityScore += 15;
            reasonParts.push('Low course progress');
          } else if (progress < 60) {
            priorityScore += 8;
          }

          // 5. Flashcard retention
          if (flashMastery !== null && flashMastery < 60) {
            priorityScore += 10;
            reasonParts.push(`Flashcard retention at ${flashMastery}%`);
          }
        }

        let priorityLevel: 'Urgent' | 'High' | 'Medium' | 'Normal' = 'Normal';
        if (priorityScore >= 70) priorityLevel = 'Urgent';
        else if (priorityScore >= 50) priorityLevel = 'High';
        else if (priorityScore >= 30) priorityLevel = 'Medium';

        return {
          subjectCode: subj.code,
          subjectName: subj.name,
          priorityRank: 0, // Will sort and assign
          priorityScore,
          priorityLevel,
          daysUntilExam: isExamPassed ? 0 : daysUntilExam,
          examDate: subj.examDate || 'TBD',
          isExamPassed,
          weakTopicsCount: subjWeakTopics.length,
          avgQuizAccuracy: avgQuizScore,
          flashcardMastery: flashMastery,
          reason: reasonParts.join(' • ') || 'Standard syllabus progression',
        };
      });

      // Sort by priorityScore descending
      prioritySubjects.sort((a: any, b: any) => b.priorityScore - a.priorityScore);
      prioritySubjects.forEach((p: any, idx: number) => {
        p.priorityRank = idx + 1;
      });

      // Filter active subjects (exclude past exams unless all passed)
      const activeSubjects = prioritySubjects.filter((p: any) => !p.isExamPassed);
      const subjectPool = activeSubjects.length > 0 ? activeSubjects : prioritySubjects;

      // Step 2: Build dates array for the plan range
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const planDates: { dateStr: string; dayAbbr: string; formattedName: string }[] = [];

      const startD = new Date(startDateStr);
      const endD = new Date(endDateStr);
      const curD = new Date(startD);

      while (curD <= endD && planDates.length < 30) {
        const dateStr = curD.toISOString().split('T')[0];
        const dayAbbr = dayNames[curD.getDay()];
        const formattedName = curD.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });

        if (studyDays.includes(dayAbbr)) {
          planDates.push({ dateStr, dayAbbr, formattedName });
        }
        curD.setDate(curD.getDate() + 1);
      }

      // If user selected days with 0 matches, fallback to at least the start date
      if (planDates.length === 0) {
        planDates.push({
          dateStr: startDateStr,
          dayAbbr: dayNames[startD.getDay()],
          formattedName: startD.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          }),
        });
      }

      // Step 3: Attempt Gemini Plan Generation with structured prompt
      let generatedPlanDays: any[] | null = null;
      let adaptationInsights: string[] = [];

      try {
        const ai = getGeminiClient();

        const prompt = `You are an expert Academic AI Study Planner.
Generate a realistic, adaptive day-by-day study schedule for a college student based on their ACTUAL academic situation.

STUDENT PROFILE & CONSTRAINTS:
- Available Study Time per Day: ${dailyMinutes} minutes (${(dailyMinutes / 60).toFixed(1)} hours)
- Target Session Length: ${sessionLength} minutes
- Study Days in Scope: ${planDates.map((d) => `${d.formattedName} (${d.dateStr})`).join(', ')}

ACTUAL SUBJECTS (Prioritized by Exam Proximity & Performance):
${prioritySubjects
  .map(
    (p: any) =>
      `- ${p.subjectCode} (${p.subjectName}): Priority ${p.priorityLevel} (Rank #${p.priorityRank}). Exam: ${p.examDate} (${p.daysUntilExam} days away). Weak Topics: ${p.weakTopicsCount}. Avg Quiz Score: ${p.avgQuizAccuracy !== null ? p.avgQuizAccuracy + '%' : 'No quiz data'}. Flashcard Mastery: ${p.flashcardMastery !== null ? p.flashcardMastery + '%' : 'No flashcard data'}. Reason: ${p.reason}`
  )
  .join('\n')}

ACTUAL WEAK TOPICS:
${
  weakTopics.length > 0
    ? weakTopics
        .map(
          (w: any) =>
            `- [${w.subjectCode}] ${w.topic || w.topicName} (Avg Score: ${w.averageQuizScore !== null && w.averageQuizScore !== undefined ? w.averageQuizScore + '%' : 'N/A'}, Mastery: ${w.flashcardMasteryPercent !== null && w.flashcardMasteryPercent !== undefined ? w.flashcardMasteryPercent + '%' : 'N/A'}, Priority: ${w.priority || 'High'}). Reason: ${w.reason || 'Needs review'}`
        )
        .join('\n')
    : 'No recorded weak topics yet. Distribute focus across core syllabus topics.'
}

RECENT QUIZ PERFORMANCE:
${
  quizHistory.length > 0
    ? quizHistory
        .slice(0, 5)
        .map((q: any) => `- ${q.subjectCode} - ${q.topicName || q.quizTitle}: ${q.scorePercent}% on ${q.date}`)
        .join('\n')
    : 'No recent quiz attempts.'
}

RECENT FLASHCARD SESSIONS:
${
  flashcardMastery.length > 0
    ? flashcardMastery
        .slice(0, 5)
        .map((f: any) => `- ${f.subjectCode} - ${f.topicName || f.deckTitle}: ${f.masteryPercent}% mastery`)
        .join('\n')
    : 'No recent flashcard review sessions.'
}

STRICT PLANNING INSTRUCTIONS:
1. Schedule tasks for each day listed in "Study Days in Scope".
2. The SUM of task durations for each day MUST NOT exceed ${dailyMinutes} minutes.
3. If study tasks on a day total >= 60 minutes, insert a 5-10 min break.
4. Give highest priority to subjects with upcoming exams and weak topics (<60% score).
5. Activity types allowed: "Learn", "Review", "AI Tutor", "Practice Quiz", "Flashcards", "Notes", "Study Material Review", "Mock Test".
6. TargetAction must be one of: "tutor", "quiz", "flashcards", "notes", "materials".
7. Provide a clear, truthful reason for each task recommendation grounded in actual data.
8. Include 2-3 adaptation insights explaining how the schedule adapted to their real performance data.

Respond ONLY with a JSON object matching this schema:
{
  "adaptationInsights": [
    "string explaining how priority was allocated based on exam proximity and weak scores"
  ],
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayName": "string, e.g. Monday, Sep 1",
      "priority": "High" | "Medium" | "Standard",
      "summary": "Brief 1-sentence summary of today's focus",
      "tasks": [
        {
          "id": "task-YYYYMMDD-index",
          "subjectCode": "string",
          "subjectName": "string",
          "topic": "string",
          "activityType": "AI Tutor" | "Practice Quiz" | "Flashcards" | "Notes" | "Study Material Review" | "Learn" | "Review" | "Mock Test" | "Break",
          "durationMinutes": number,
          "reason": "string reason",
          "isBreak": boolean,
          "completed": false,
          "targetAction": "tutor" | "quiz" | "flashcards" | "notes" | "materials"
        }
      ]
    }
  ]
}`;

        const response = await generateContentWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        const text = response.text;
        if (text) {
          let parsed: any = null;
          try {
            parsed = JSON.parse(text);
          } catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) parsed = JSON.parse(match[0]);
          }

          if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
            generatedPlanDays = parsed.days;
            if (Array.isArray(parsed.adaptationInsights)) {
              adaptationInsights = parsed.adaptationInsights;
            }
          }
        }
      } catch (geminiErr: any) {
        console.warn('Gemini Study Planner generation notice, switching to deterministic academic engine:', geminiErr.message);
      }

      // Step 4: Algorithmic Fallback Engine if Gemini was unavailable
      if (!generatedPlanDays || generatedPlanDays.length === 0) {
        adaptationInsights = [
          `Prioritized ${subjectPool[0]?.subjectName || 'Advance Java'} as highest priority due to closest exam date and performance profile.`,
          `Allocated structured ${sessionLength}-minute sessions with active recall and practice tests within your ${dailyMinutes}-minute daily budget.`,
        ];

        generatedPlanDays = planDates.map((planDate, dayIdx) => {
          const assignedSubject = subjectPool[dayIdx % subjectPool.length];
          const subjWeak = weakTopics.filter((w: any) => w.subjectCode === assignedSubject.subjectCode);
          
          let primaryTopic = 'Core Syllabus Concepts & Architectures';
          let topicReason = `Exam scheduled in ${assignedSubject.daysUntilExam} days (${assignedSubject.examDate}).`;

          if (subjWeak.length > 0) {
            const wt = subjWeak[dayIdx % subjWeak.length];
            primaryTopic = wt.topic || wt.topicName;
            topicReason = wt.reason || `Weak topic with average score of ${wt.averageQuizScore ?? 50}%.`;
          } else if (assignedSubject.topics && assignedSubject.topics.length > 0) {
            primaryTopic = assignedSubject.topics[dayIdx % assignedSubject.topics.length];
          }

          const dayTasks: any[] = [];
          let currentDayMinutes = 0;

          // Task 1: Concept Review / AI Tutor
          const task1Duration = Math.min(sessionLength, dailyMinutes - currentDayMinutes);
          if (task1Duration >= 20) {
            dayTasks.push({
              id: `task-${planDate.dateStr}-1`,
              subjectCode: assignedSubject.subjectCode,
              subjectName: assignedSubject.subjectName,
              topic: primaryTopic,
              activityType: subjWeak.length > 0 ? 'AI Tutor' : 'Learn',
              durationMinutes: task1Duration,
              reason: topicReason,
              isBreak: false,
              completed: false,
              targetAction: 'tutor',
            });
            currentDayMinutes += task1Duration;
          }

          // Optional Break if >= 60 min session
          if (dailyMinutes >= 75 && currentDayMinutes >= 45 && dailyMinutes - currentDayMinutes >= 35) {
            dayTasks.push({
              id: `task-${planDate.dateStr}-break`,
              subjectCode: assignedSubject.subjectCode,
              subjectName: assignedSubject.subjectName,
              topic: 'Cognitive Rest & Hydration',
              activityType: 'Break',
              durationMinutes: 10,
              reason: 'Rest interval to prevent cognitive fatigue and improve memory consolidation.',
              isBreak: true,
              completed: false,
            });
            currentDayMinutes += 10;
          }

          // Task 2: Active Practice / Quiz or Flashcards
          const task2Duration = Math.min(sessionLength, dailyMinutes - currentDayMinutes);
          if (task2Duration >= 20) {
            const isQuiz = dayIdx % 2 === 0;
            dayTasks.push({
              id: `task-${planDate.dateStr}-2`,
              subjectCode: assignedSubject.subjectCode,
              subjectName: assignedSubject.subjectName,
              topic: primaryTopic,
              activityType: isQuiz ? 'Practice Quiz' : 'Flashcards',
              durationMinutes: task2Duration,
              reason: isQuiz
                ? `Validate mastery on ${primaryTopic} with active diagnostic testing.`
                : `Active spaced recall for high-yield definitions in ${assignedSubject.subjectCode}.`,
              isBreak: false,
              completed: false,
              targetAction: isQuiz ? 'quiz' : 'flashcards',
            });
            currentDayMinutes += task2Duration;
          }

          return {
            date: planDate.dateStr,
            dayName: planDate.formattedName,
            priority: assignedSubject.priorityLevel === 'Urgent' ? 'High' : 'Medium',
            summary: `Focused study on ${assignedSubject.subjectCode}: ${primaryTopic}`,
            tasks: dayTasks,
          };
        });
      }

      // Step 5: Post-process and validate day totals
      let totalPlannedMinutes = 0;
      let totalTasksCount = 0;

      const validatedDays = generatedPlanDays.map((day: any, dIdx: number) => {
        let dayMinutes = 0;
        const validTasks = (day.tasks || []).map((task: any, tIdx: number) => {
          const duration = Number(task.durationMinutes) || 30;
          dayMinutes += duration;
          if (!task.isBreak) {
            totalTasksCount++;
          }
          return {
            id: task.id || `task-${day.date || dIdx}-${tIdx}`,
            subjectCode: task.subjectCode || subjectPool[0]?.subjectCode || 'ADV-JAVA',
            subjectName: task.subjectName || subjectPool[0]?.subjectName || 'Advance Java',
            topic: task.topic || 'Core Fundamentals',
            activityType: task.activityType || (task.isBreak ? 'Break' : 'Learn'),
            durationMinutes: duration,
            reason: task.reason || 'Syllabus requirement and upcoming exam review',
            isBreak: Boolean(task.isBreak || task.activityType === 'Break'),
            completed: Boolean(task.completed),
            completedAt: task.completedAt,
            targetAction: task.targetAction || (task.activityType === 'Practice Quiz' ? 'quiz' : task.activityType === 'Flashcards' ? 'flashcards' : task.activityType === 'Notes' ? 'notes' : 'tutor'),
          };
        });

        totalPlannedMinutes += dayMinutes;

        return {
          date: day.date || planDates[dIdx]?.dateStr || startDateStr,
          dayName: day.dayName || planDates[dIdx]?.formattedName || 'Study Day',
          totalMinutes: dayMinutes,
          priority: day.priority || 'Medium',
          summary: day.summary || `Study sessions for ${day.date}`,
          tasks: validTasks,
        };
      });

      const planId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const finalStudyPlan: any = {
        id: planId,
        planId,
        userId: userId || 'anonymous',
        generatedAt: new Date().toISOString(),
        startDate: startDateStr,
        endDate: endDateStr,
        preferences: {
          dailyStudyMinutes: dailyMinutes,
          sessionLengthMinutes: sessionLength,
          studyDays,
          startDate: startDateStr,
          endDate: endDateStr,
          targetSubject: preferences?.targetSubject || 'ALL',
        },
        prioritySubjects,
        days: validatedDays,
        totalPlannedMinutes,
        totalTasksCount,
        completedTasksCount: 0,
        adaptationInsights,
        isCurrent: true,
      };

      return res.json({
        success: true,
        data: finalStudyPlan,
      });
    } catch (error: any) {
      console.error('Fatal error in /api/planner/generate:', error);
      return res.status(500).json({
        error: 'Failed to generate study plan: ' + error.message,
      });
    }
  });


  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
