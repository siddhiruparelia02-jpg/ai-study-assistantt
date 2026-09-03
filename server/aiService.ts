import { Type } from '@google/genai';
import {
  getGeminiClient,
  generateContentWithFallback,
  safeParseJson,
  sanitizeInput,
  aiCache,
  aiTelemetry,
} from './aiConfig';

/* =========================================================================
   1. AI TUTOR SERVICE (Pedagogical Flow & Socratic Reasoning)
   ========================================================================= */

export interface TutorChatParams {
  question: string;
  subject?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  history?: Array<{ sender: string; text: string }>;
}

export interface TutorStructuredResponse {
  simpleExplanation: string;
  stepByStepExplanation: string[];
  analogy: string;
  example: string;
  keyTakeaways: string[];
  followUpQuestion: string;
  isAmbiguous?: boolean;
  clarificationQuestion?: string;
}

export async function generateTutorResponse(
  params: TutorChatParams
): Promise<TutorStructuredResponse> {
  const sanitizedQuestion = sanitizeInput(params.question, 1000);
  const subject = params.subject || 'General Academic Studies';
  const difficulty = params.difficulty || 'Beginner';
  const history = params.history || [];

  // Check cache for identical question & subject & difficulty
  const cacheKey = `tutor:${subject}:${difficulty}:${sanitizedQuestion.toLowerCase().trim()}`;
  const cached = aiCache.get<TutorStructuredResponse>(cacheKey);
  if (cached) {
    aiTelemetry.record({
      event: 'tutor_chat',
      success: true,
      durationMs: 2,
      cached: true,
    });
    return cached;
  }

  const systemInstruction = `You are an elite, patient, and pedagogically structured AI Academic Tutor for college and university students.
Current Subject Domain: ${subject}
Student Academic Level: ${difficulty}

PEDAGOGICAL TEACHING DIRECTIVE:
Structure every answer logically to maximize conceptual clarity, retention, and exam readiness:
1. Concept Definition & Direct Answer: Begin with a crystal-clear, direct answer or definition without filler ("Hello! In this answer...").
2. Step-by-Step Breakdown: Provide a logical sequential progression breaking the topic into easily digestible operational steps.
3. Intuitive Analogy: Provide a relatable, real-world metaphor or mental model that bridges abstract theory to tangible intuition.
4. Concrete Academic Example: Provide a working, concrete example (e.g. valid syntax code snippet for programming, solved arithmetic for quant, or operational flow for admin).
5. High-Yield Key Invariants / Takeaways: 3-4 bullet points that are essential for university exams.
6. Active Recall Quick Check / Follow-Up: End with an engaging self-test question that asks the student to apply what was just explained.
7. Ambiguity Handling: If the student's question is overly ambiguous, set isAmbiguous: true and provide a helpful clarification question.

Tone: Encouraging, precise, scholarly yet accessible, avoiding superficial fluff.`;

  let promptContent = `Student Question: ${sanitizedQuestion}\n`;
  if (history.length > 0) {
    promptContent += `\nRecent Dialogue History:\n`;
    history.slice(-4).forEach((h) => {
      promptContent += `${h.sender === 'user' ? 'Student' : 'Tutor'}: ${sanitizeInput(h.text, 500)}\n`;
    });
    promptContent += `\nCurrent Question to answer: ${sanitizedQuestion}`;
  }

  try {
    const ai = getGeminiClient();
    const response = await generateContentWithFallback(ai, {
      contents: promptContent,
      eventName: 'tutor_chat',
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            simpleExplanation: {
              type: Type.STRING,
              description: 'Clear, direct 2-3 sentence conceptual explanation addressing the student question',
            },
            stepByStepExplanation: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 5 clear sequential steps explaining the mechanism or rationale',
            },
            analogy: {
              type: Type.STRING,
              description: 'Real-world mental model or everyday analogy to make the concept memorable',
            },
            example: {
              type: Type.STRING,
              description: 'Practical concrete example, code snippet, or formula calculation',
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 4 high-yield points crucial for exams',
            },
            followUpQuestion: {
              type: Type.STRING,
              description: 'A quick-check self-test question prompting active student recall',
            },
            isAmbiguous: {
              type: Type.BOOLEAN,
              description: 'True if question lacked necessary context or was vague',
            },
            clarificationQuestion: {
              type: Type.STRING,
              description: 'Question to ask student if ambiguous, else empty string',
            },
          },
          required: [
            'simpleExplanation',
            'stepByStepExplanation',
            'analogy',
            'example',
            'keyTakeaways',
            'followUpQuestion',
          ],
        },
      },
    });

    const parsed = safeParseJson<TutorStructuredResponse>(response.text);
    if (parsed && parsed.simpleExplanation) {
      aiCache.set(cacheKey, parsed, 1000 * 60 * 60); // 1 hour TTL
      return parsed;
    }
  } catch (err: any) {
    console.warn('Gemini Tutor call failed, engaging pedagogical fallback:', err.message);
  }

  // Fallback response with pedagogical integrity
  const fallback = getFallbackTutorResponse(sanitizedQuestion, subject, difficulty);
  return fallback;
}

function getFallbackTutorResponse(
  question: string,
  subject: string,
  difficulty: string
): TutorStructuredResponse {
  const qLower = question.toLowerCase();

  if (qLower.includes('jdbc') || qLower.includes('driver')) {
    return {
      simpleExplanation:
        'JDBC (Java Database Connectivity) Drivers are client-side software components that enable Java applications to interact with relational databases. Type 4 (Pure Java Native Protocol) drivers convert JDBC calls directly into vendor-specific network protocols without native OS binaries or intermediate servers.',
      stepByStepExplanation: [
        '1. Application loads the driver class and requests a Connection via DriverManager.',
        '2. The Driver establishes a raw TCP/IP socket connection directly to the database server port (e.g. port 3306 for MySQL or 1521 for Oracle).',
        '3. PreparedStatement compiles the SQL template on the server and accepts bind parameters safely.',
        '4. The query executes, and the database streams rows back across the socket into a ResultSet object.',
      ],
      analogy:
        'Think of a Type 1 Driver like speaking to a translator who speaks to an interpreter who speaks to the recipient. A Type 4 Driver is like speaking the recipient’s native language directly on a dedicated telephone line.',
      example: `// Type 4 Driver Direct Connection & PreparedStatement
String url = "jdbc:mysql://localhost:3306/university_db";
try (Connection conn = DriverManager.getConnection(url, "user", "secret");
     PreparedStatement stmt = conn.prepareStatement("SELECT * FROM students WHERE semester = ?")) {
    stmt.setInt(1, 4);
    try (ResultSet rs = stmt.executeQuery()) {
        while (rs.next()) {
            System.out.println(rs.getString("student_name"));
        }
    }
}`,
      keyTakeaways: [
        'Type 4 drivers are 100% Pure Java, making them completely platform-independent.',
        'They offer the highest performance because they bypass ODBC and middleware conversion layers.',
        'Always close Connection, Statement, and ResultSet using try-with-resources to prevent connection pool exhaustion.',
      ],
      followUpQuestion:
        'Quick Check: Why does using PreparedStatement prevent SQL Injection attacks compared to a standard Statement?',
      isAmbiguous: false,
    };
  }

  if (qLower.includes('inode') || qLower.includes('link') || qLower.includes('permission')) {
    return {
      simpleExplanation:
        'In Linux filesystems, an inode (index node) is a data structure storing all metadata about a file (permissions, owner, size, timestamps, data block pointers) except its file name and actual data.',
      stepByStepExplanation: [
        '1. Each file has an inode number visible using `ls -i`.',
        '2. A Hard Link is simply an additional directory entry pointing directly to the exact same inode number.',
        '3. A Soft Link (Symbolic Link) is a distinct, small file with its own inode containing the pathname string of the target file.',
        '4. Deleting the original file breaks a soft link (dangling link), but hard links remain intact until their reference counter drops to 0.',
      ],
      analogy:
        'A Hard Link is having two different names on two house deeds pointing to the exact same physical house. A Soft Link is a sticky note with an address written on it: if you demolish the house, the note still exists but points to rubble.',
      example: `# Inspect inodes and link behavior
$ touch master.txt
$ ln master.txt hardlink.txt      # Same inode number
$ ln -s master.txt symlink.txt    # New inode pointing to path 'master.txt'
$ ls -li master.txt hardlink.txt symlink.txt`,
      keyTakeaways: [
        'Hard links cannot cross filesystem boundaries or link directories (to avoid infinite loops).',
        'Soft links can point across filesystems and to directories.',
        'File permissions (octal: 755 = rwxr-xr-x) are stored inside the inode, not the filename.',
      ],
      followUpQuestion:
        'Quick Check: If you run `chmod 644 file.txt`, what permissions are granted to the file owner, group, and others?',
      isAmbiguous: false,
    };
  }

  // Default pedagogical fallback for any query
  return {
    simpleExplanation: `In ${subject}, **${question.slice(0, 50)}** revolves around establishing core behavioral invariants and predictable data contracts at runtime.`,
    stepByStepExplanation: [
      `1. Conceptual foundation: Identify the primary entities and domain rules governing ${question.slice(0, 30)}.`,
      '2. Execution mechanics: Trace how parameters and state transitions flow through the lifecycle.',
      '3. Boundary checks: Validate edge cases, exceptional states, and memory/performance constraints.',
      '4. Final resolution: Verify the outputs match expected theoretical invariants.',
    ],
    analogy:
      'Like an automated airport baggage carousel, inputs follow a standardized conveyor track where every item is tagged, sorted, and routed to prevent data loss or collisions.',
    example: `// Core Architectural Pattern Example
class Demonstration {
    // Defines standard contract for ${question.slice(0, 20)}
    public void executeProcess() {
        System.out.println("Executing verified workflow according to academic specification.");
    }
}`,
    keyTakeaways: [
      `Master the core formal definitions and operational constraints of ${question.slice(0, 30)}.`,
      'Pay close attention to boundary conditions and common runtime pitfalls.',
      'Always relate theoretical principles back to standard exam problem patterns.',
    ],
    followUpQuestion:
      'Quick Check: What is the primary advantage of applying this architectural approach over an unconstrained procedural implementation?',
    isAmbiguous: false,
  };
}

/* =========================================================================
   2. "ASK MY NOTES" SERVICE (Strict Document Grounding & Citation)
   ========================================================================= */

export interface AskNotesParams {
  materialTitle: string;
  materialSubject: string;
  materialCategory?: string;
  materialContent: string;
  question: string;
  history?: Array<{ sender: string; text: string }>;
}

export interface AskNotesResponse {
  isFoundInDocument: boolean;
  answerMarkdown: string;
  sourceSection: string;
  sourceExcerpt: string;
  confidence: 'High' | 'Medium' | 'Low';
  suggestGeneralTutor: boolean;
  suggestedQuestions: string[];
}

export async function generateAskNotesResponse(
  params: AskNotesParams
): Promise<AskNotesResponse> {
  const question = sanitizeInput(params.question, 1000);
  const docText = (params.materialContent || '').trim();

  if (!docText || docText.length < 20) {
    return {
      isFoundInDocument: false,
      answerMarkdown:
        'This document does not contain readable or indexed text. Please ensure the study material has readable content or upload a text, markdown, or searchable PDF document.',
      sourceSection: 'N/A',
      sourceExcerpt: '',
      confidence: 'Low',
      suggestGeneralTutor: true,
      suggestedQuestions: [
        'How can I convert this file to searchable text?',
        'Explain this topic generally using the AI Tutor.',
      ],
    };
  }

  // System instruction enforcing strict document grounding
  const systemInstruction = `You are a strict, precise Document-Grounded Academic Assistant ("Ask My Notes") for university students.
The student has selected a specific course study document: "${params.materialTitle}" (Subject: ${params.materialSubject}, Category: ${params.materialCategory || 'Notes'}).

AUTHORITATIVE PRIMARY SOURCE OF TRUTH:
The text provided inside <DOCUMENT_CONTENT> below is your ONLY primary source of truth.

STRICT GROUNDING DIRECTIVES:
1. Grounding Rule: Base your answer EXCLUSIVELY and DIRECTLY on the provided document content.
2. If the document DOES NOT contain sufficient information to answer the question, or if the question asks about something completely unmentioned in the document:
   - Set "isFoundInDocument" to false.
   - Set "confidence" to "Low".
   - Set "answerMarkdown" to EXACTLY: "I couldn't find enough information about this in your selected study material."
   - Set "suggestGeneralTutor" to true.
   - Set "sourceSection" to "Not Found in Selected Document".
   - Set "sourceExcerpt" to "".
   - Provide 2-3 suggestedQuestions that ARE actually discussed in the provided document.
   - CRITICAL: Never invent, extrapolate, hallucinate, or pretend external facts came from the document.
3. If the document DOES contain sufficient information:
   - Set "isFoundInDocument" to true.
   - Set "confidence" to "High" (if directly stated and detailed in the text) or "Medium" (if briefly mentioned or partially described).
   - In "answerMarkdown", provide a clear, well-structured, student-friendly explanation citing facts from the document. Use markdown headings, bullet points, and code blocks where helpful.
   - In "sourceSection", identify the specific Section, Heading, or Module title from the document where this information is located (e.g. "Section 1: Definition of Inheritance", "Section 3: The super Keyword", etc.).
   - In "sourceExcerpt", provide a brief verbatim or near-verbatim quote (1-3 sentences) directly from the text that supports your answer.
   - Set "suggestGeneralTutor" to false.
   - Provide 2-3 relevant follow-up "suggestedQuestions" based on the document's topics.`;

  let promptContent = `<DOCUMENT_CONTENT>\n${docText.slice(0, 45000)}\n</DOCUMENT_CONTENT>\n\n`;
  if (Array.isArray(params.history) && params.history.length > 0) {
    promptContent += `Prior Q&A History:\n`;
    params.history.slice(-4).forEach((h) => {
      promptContent += `${h.sender === 'user' ? 'Student' : 'Assistant'}: ${sanitizeInput(h.text, 500)}\n`;
    });
    promptContent += `\nCurrent Question: ${question}\n\nPlease evaluate the document and return structured JSON adhering to the schema.`;
  } else {
    promptContent += `Student Question: ${question}\n\nPlease evaluate the document and return structured JSON adhering to the schema.`;
  }

  try {
    const ai = getGeminiClient();
    const response = await generateContentWithFallback(ai, {
      contents: promptContent,
      eventName: 'ask_notes',
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFoundInDocument: {
              type: Type.BOOLEAN,
              description: 'True if sufficient information exists in the document, false otherwise',
            },
            answerMarkdown: {
              type: Type.STRING,
              description: 'The answer based strictly on the document, or the exact not-found message',
            },
            sourceSection: {
              type: Type.STRING,
              description: 'Section or heading in the document where the answer was found',
            },
            sourceExcerpt: {
              type: Type.STRING,
              description: 'Direct quote or excerpt from the document supporting the answer',
            },
            confidence: {
              type: Type.STRING,
              enum: ['High', 'Medium', 'Low'],
              description: 'Confidence level of the grounding',
            },
            suggestGeneralTutor: {
              type: Type.BOOLEAN,
              description: 'True if the student should be directed to the general AI Tutor for external knowledge',
            },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 3 relevant follow-up questions grounded in the document',
            },
          },
          required: [
            'isFoundInDocument',
            'answerMarkdown',
            'sourceSection',
            'sourceExcerpt',
            'confidence',
            'suggestGeneralTutor',
            'suggestedQuestions',
          ],
        },
      },
    });

    const parsed = safeParseJson<AskNotesResponse>(response.text);
    if (parsed && typeof parsed.isFoundInDocument === 'boolean') {
      return parsed;
    }
  } catch (err: any) {
    console.warn('Gemini Ask-Notes call failed, running text search fallback:', err.message);
  }

  // Robust algorithmic search fallback directly inside docText
  return textSearchGroundingFallback(docText, question, params.materialTitle);
}

function textSearchGroundingFallback(
  docText: string,
  question: string,
  materialTitle: string
): AskNotesResponse {
  const qLower = question.toLowerCase();
  const sectionBlocks = docText.split(/(?=\n## |\n# )/);

  const questionKeywords = qLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        ![
          'what',
          'when',
          'where',
          'which',
          'explain',
          'tell',
          'about',
          'this',
          'notes',
          'from',
          'does',
          'have',
          'with',
        ].includes(w)
    );

  let bestScore = 0;
  let bestBlock = '';

  for (const block of sectionBlocks) {
    const blockLower = block.toLowerCase();
    let score = 0;
    for (const kw of questionKeywords) {
      if (blockLower.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestBlock = block;
    }
  }

  if (bestScore > 0 || (questionKeywords.length === 0 && docText.length > 50)) {
    const firstLine = bestBlock.trim().split('\n')[0].replace(/^[#\s]+/, '');
    const matchedSectionTitle = firstLine || `${materialTitle} (Core Content)`;
    const lines = bestBlock
      .split('\n')
      .filter((l) => l.trim().length > 20 && !l.startsWith('#'));
    const matchedExcerpt = lines.slice(0, 2).join(' ') || bestBlock.slice(0, 200).trim();

    let cleanAnswer = '';
    if (
      qLower.includes('important point') ||
      qLower.includes('key point') ||
      qLower.includes('summary') ||
      qLower.includes('summarize')
    ) {
      cleanAnswer =
        `Based on your selected document **${materialTitle}**:\n\n` +
        `### Key Points from ${matchedSectionTitle}:\n` +
        bestBlock
          .split('\n')
          .filter((l) => l.trim().length > 0 && !l.startsWith('#'))
          .slice(0, 5)
          .map((l) => `* ${l.replace(/^[-*•\d.]\s*/, '')}`)
          .join('\n');
    } else if (
      qLower.includes('definition') ||
      qLower.includes('define') ||
      qLower.includes('what is')
    ) {
      cleanAnswer =
        `According to **${materialTitle}** under **${matchedSectionTitle}**:\n\n` +
        `${matchedExcerpt}\n\n` +
        `This establishes the core relationship documented in your course material.`;
    } else {
      cleanAnswer =
        `According to your study material **${materialTitle}** (${matchedSectionTitle}):\n\n` +
        `${bestBlock.trim().slice(0, 500)}\n\n` +
        `*(Grounded in the indexed text of ${materialTitle})*`;
    }

    return {
      isFoundInDocument: true,
      answerMarkdown: cleanAnswer,
      sourceSection: matchedSectionTitle,
      sourceExcerpt: matchedExcerpt.slice(0, 250),
      confidence: bestScore >= 2 ? 'High' : 'Medium',
      suggestGeneralTutor: false,
      suggestedQuestions: [
        'Explain this topic simply.',
        'What are the important points?',
        'What could be asked in an exam?',
      ],
    };
  }

  // Not found in document
  return {
    isFoundInDocument: false,
    answerMarkdown:
      "I couldn't find enough information about this in your selected study material.",
    sourceSection: 'Not Found in Selected Document',
    sourceExcerpt: '',
    confidence: 'Low',
    suggestGeneralTutor: true,
    suggestedQuestions: [
      'Explain this topic simply.',
      'What are the important points in this document?',
      'What definitions should I remember from these notes?',
    ],
  };
}

/* =========================================================================
   3. QUIZ GENERATION & QUALITY VALIDATION SERVICE
   ========================================================================= */

export interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
  subjectCode: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizGenerationParams {
  subject: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Hard';
  questionCount: number;
  questionType?: string;
  materialContent?: string;
}

export interface GeneratedQuizResult {
  title: string;
  subjectCode: string;
  difficulty: string;
  questions: QuizQuestionItem[];
}

/**
 * Quiz Quality Validation:
 * Validates options count, uniqueness, valid index, and robust explanation.
 */
export function validateQuizQuestions(
  questions: any[],
  fallbackTopic: string,
  fallbackSubject: string,
  fallbackDifficulty: 'Easy' | 'Medium' | 'Hard'
): QuizQuestionItem[] {
  if (!Array.isArray(questions)) return [];

  const validated: QuizQuestionItem[] = [];

  for (let idx = 0; idx < questions.length; idx++) {
    const q = questions[idx];
    if (!q || typeof q.question !== 'string' || !q.question.trim()) continue;

    // Check options array
    let options: string[] = Array.isArray(q.options)
      ? q.options.map((o: any) => String(o).trim()).filter((o: string) => o.length > 0)
      : [];

    // Ensure exactly 4 options
    if (options.length < 4) {
      const needed = 4 - options.length;
      for (let i = 0; i < needed; i++) {
        options.push(`Alternative ${String.fromCharCode(65 + options.length)}`);
      }
    } else if (options.length > 4) {
      options = options.slice(0, 4);
    }

    // Ensure uniqueness
    const uniqueOptions = Array.from(new Set(options));
    if (uniqueOptions.length < 4) {
      options = [
        options[0] || 'Standard behavior',
        options[1] || 'Alternate implementation',
        options[2] || 'Legacy fallback protocol',
        options[3] || 'None of the above',
      ];
    }

    // Check correctAnswerIndex bounds
    let correctIdx = Number(q.correctAnswerIndex);
    if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= 4) {
      correctIdx = 0;
    }

    // Check explanation
    const explanation =
      typeof q.explanation === 'string' && q.explanation.trim().length > 15
        ? q.explanation.trim()
        : `Option ${String.fromCharCode(65 + correctIdx)} is correct because it directly adheres to the fundamental specifications of ${q.topic || fallbackTopic}.`;

    validated.push({
      id: q.id || `gen-q-${idx + 1}-${Date.now()}`,
      question: q.question.trim(),
      options,
      correctAnswerIndex: correctIdx,
      explanation,
      topic: q.topic || fallbackTopic,
      subjectCode: q.subjectCode || fallbackSubject,
      difficulty:
        q.difficulty === 'Hard' || q.difficulty === 'Easy' ? q.difficulty : fallbackDifficulty,
    });
  }

  return validated;
}

export async function generateQuiz(
  params: QuizGenerationParams
): Promise<GeneratedQuizResult> {
  const subject = params.subject || 'Advance Java';
  const topic = sanitizeInput(params.topic || 'Core Syllabus Concepts', 200);
  const difficulty = params.difficulty || 'Intermediate';
  const count = Math.min(Math.max(Number(params.questionCount) || 5, 3), 10);
  const mappedDiff: 'Easy' | 'Medium' | 'Hard' =
    difficulty === 'Hard' ? 'Hard' : difficulty === 'Beginner' ? 'Easy' : 'Medium';

  const cacheKey = `quiz:${subject}:${topic}:${difficulty}:${count}`;
  const cached = aiCache.get<GeneratedQuizResult>(cacheKey);
  if (cached) {
    aiTelemetry.record({
      event: 'quiz_generate',
      success: true,
      durationMs: 2,
      cached: true,
    });
    return cached;
  }

  const systemInstruction = `You are an expert University Exam Question Writer and Academic Assessment Specialist.
Your task is to generate exactly ${count} high-quality, exam-standard multiple-choice questions for the course "${subject}" on the topic "${topic}".
Difficulty Level: ${difficulty} (${mappedDiff}).

QUESTION CREATION DIRECTIVES:
1. Grounding: Questions must test real conceptual comprehension, code tracing, or problem-solving—not trivial trivia.
2. Unambiguous Options: Exactly 4 distinct choices per question. Only ONE option must be objectively correct.
3. Realistic Distractors: Distractors must represent common student misconceptions, inverted logic, or syntax confusion. Do NOT use silly joke options.
4. Explanations: Write a clear, comprehensive explanation explaining why the correct option is right and highlighting the specific misconception in the distractors.
5. Difficulty Matching:
   - Beginner/Easy: Definitional questions and direct syntax/property recognition.
   - Intermediate/Medium: Multi-step reasoning and scenario diagnosis.
   - Hard/Exam Standard: Code tracing, edge cases, exception propagation, or boundary invariants.`;

  const promptContent = `Please generate ${count} multiple choice questions for ${subject} - ${topic} (${difficulty}). Return structured JSON.`;

  try {
    const ai = getGeminiClient();
    const response = await generateContentWithFallback(ai, {
      contents: promptContent,
      eventName: 'quiz_generate',
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Descriptive quiz title' },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: 'Clear question stem' },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Exactly 4 distinct plausible options',
                  },
                  correctAnswerIndex: {
                    type: Type.INTEGER,
                    description: 'Index of correct answer (0, 1, 2, or 3)',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Detailed explanation of why the correct option is right',
                  },
                  topic: { type: Type.STRING, description: 'Topic name' },
                  difficulty: {
                    type: Type.STRING,
                    enum: ['Easy', 'Medium', 'Hard'],
                    description: 'Difficulty tier',
                  },
                },
                required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
              },
            },
          },
          required: ['title', 'questions'],
        },
      },
    });

    const parsed = safeParseJson<{ title?: string; questions?: any[] }>(response.text);
    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      const validatedQuestions = validateQuizQuestions(
        parsed.questions,
        topic,
        subject,
        mappedDiff
      );

      if (validatedQuestions.length > 0) {
        const result: GeneratedQuizResult = {
          title: parsed.title || `${subject}: ${topic} (${difficulty})`,
          subjectCode: subject.includes(' - ') ? subject.split(' - ')[0] : subject.slice(0, 8),
          difficulty,
          questions: validatedQuestions,
        };
        aiCache.set(cacheKey, result, 1000 * 60 * 60);
        return result;
      }
    }
  } catch (err: any) {
    console.warn('Gemini Quiz call failed, engaging academic fallback questions:', err.message);
  }

  // High-yield academic fallback
  return getFallbackQuiz(subject, topic, mappedDiff, count);
}

function getFallbackQuiz(
  subject: string,
  topic: string,
  diff: 'Easy' | 'Medium' | 'Hard',
  count: number
): GeneratedQuizResult {
  const isJava = subject.toLowerCase().includes('java') || topic.toLowerCase().includes('java');
  const isLinux = subject.toLowerCase().includes('linux') || topic.toLowerCase().includes('linux');

  let pool: QuizQuestionItem[] = [];

  if (isJava) {
    pool = [
      {
        id: 'fallback-j-1',
        question:
          'In Java, what occurs when a subclass defines a method with the exact same name and signature as a method in its superclass?',
        options: [
          'Method Overriding',
          'Method Overloading',
          'Dynamic Data Binding',
          'Constructor Chaining',
        ],
        correctAnswerIndex: 0,
        explanation:
          'Method Overriding occurs when a subclass provides a specific implementation of a method already defined in its superclass with the exact same name, return type, and parameters.',
        topic: 'Inheritance & Polymorphism',
        subjectCode: 'ADV-JAVA',
        difficulty: 'Easy',
      },
      {
        id: 'fallback-j-2',
        question:
          'Which statement regarding the JDBC Type 4 Native Protocol Driver is technically ACCURATE?',
        options: [
          'It communicates directly with the database engine via vendor-specific TCP/IP sockets without client-side native libraries.',
          'It requires ODBC binary drivers installed on the host operating system.',
          'It relies on a dedicated intermediate middleware server to translate SQL into RPC.',
          'It cannot support transactions or PreparedStatement batching.',
        ],
        correctAnswerIndex: 0,
        explanation:
          'Type 4 drivers are 100% pure Java and translate JDBC calls directly into vendor-specific network protocols, requiring zero client-side native binaries.',
        topic: 'JDBC & Database Connectivity',
        subjectCode: 'ADV-JAVA',
        difficulty: 'Medium',
      },
      {
        id: 'fallback-j-3',
        question:
          'Given: `List<Number> list = new ArrayList<Integer>();` in Java. What happens during compilation?',
        options: [
          'A compilation error occurs because generic type arguments are invariant in Java.',
          'The code compiles cleanly due to polymorphic subtyping.',
          'A ClassCastException is thrown at runtime.',
          'The compiler automatically inserts wildcards `<? extends Number>`.',
        ],
        correctAnswerIndex: 0,
        explanation:
          'Generic types in Java are invariant: even though Integer is a subtype of Number, `List<Integer>` is NOT a subtype of `List<Number>`. To allow subtyping, the wildcard `List<? extends Number>` must be used.',
        topic: 'Generics & Collections',
        subjectCode: 'ADV-JAVA',
        difficulty: 'Hard',
      },
      {
        id: 'fallback-j-4',
        question:
          'Which method in the Java Servlet lifecycle is executed only ONCE during initialization?',
        options: ['init(ServletConfig config)', 'service(req, res)', 'doGet()', 'destroy()'],
        correctAnswerIndex: 0,
        explanation:
          'The Servlet container invokes `init()` exactly once when the servlet is first instantiated and loaded into memory.',
        topic: 'Servlets & JSP',
        subjectCode: 'ADV-JAVA',
        difficulty: 'Easy',
      },
    ];
  } else if (isLinux) {
    pool = [
      {
        id: 'fallback-l-1',
        question: 'What numerical octal permission code corresponds to `rwxr-xr--`?',
        options: ['754', '755', '644', '764'],
        correctAnswerIndex: 0,
        explanation:
          'rwx = 4+2+1 = 7 (owner), r-x = 4+0+1 = 5 (group), r-- = 4+0+0 = 4 (others). Together: 754.',
        topic: 'Linux File Permissions',
        subjectCode: 'LINUX',
        difficulty: 'Easy',
      },
      {
        id: 'fallback-l-2',
        question:
          'What happens to an existing Hard Link if the original source file is deleted via `rm`?',
        options: [
          'The hard link remains fully readable because its inode reference count decrements by 1 without reaching 0.',
          'The hard link becomes a broken dangling link pointing to unallocated space.',
          'The operating system immediately clears the inode blocks from the disk.',
          'The kernel prompts for confirmation to cascade delete all remaining links.',
        ],
        correctAnswerIndex: 0,
        explanation:
          'A hard link points directly to the inode. Deleting a directory entry only decrements the inode link count; data blocks are only freed when the link count reaches zero.',
        topic: 'Inodes & Hard Links',
        subjectCode: 'LINUX',
        difficulty: 'Medium',
      },
    ];
  } else {
    pool = [
      {
        id: 'fallback-g-1',
        question: `What is the foundational invariant governing ${topic}?`,
        options: [
          'Inputs must adhere strictly to predefined validation and contract specifications.',
          'State transitions occur non-deterministically without serialization.',
          'Data structures should avoid encapsulation boundaries.',
          'Execution proceeds without validating precondition constraints.',
        ],
        correctAnswerIndex: 0,
        explanation:
          'Validating preconditions and maintaining structural invariants ensures deterministic execution and prevents unhandled runtime exceptions.',
        topic,
        subjectCode: subject,
        difficulty: 'Medium',
      },
    ];
  }

  const selected = pool.slice(0, count);
  return {
    title: `${subject}: ${topic} Practice Quiz`,
    subjectCode: subject.slice(0, 8),
    difficulty: diff,
    questions: selected,
  };
}

/* =========================================================================
   4. FLASHCARD GENERATION SERVICE (Active Recall & High-Yield Concept)
   ========================================================================= */

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface GeneratedFlashcardDeckResult {
  title: string;
  description: string;
  cards: FlashcardItem[];
}

export async function generateFlashcards(params: {
  subject: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Hard';
  cardCount: number;
}): Promise<GeneratedFlashcardDeckResult> {
  const subject = params.subject || 'Advance Java';
  const topic = sanitizeInput(params.topic || 'Core Syllabus', 200);
  const difficulty = params.difficulty || 'Intermediate';
  const count = Math.min(Math.max(Number(params.cardCount) || 6, 4), 12);

  const cacheKey = `flashcards:${subject}:${topic}:${difficulty}:${count}`;
  const cached = aiCache.get<GeneratedFlashcardDeckResult>(cacheKey);
  if (cached) {
    aiTelemetry.record({
      event: 'flashcards_generate',
      success: true,
      durationMs: 2,
      cached: true,
    });
    return cached;
  }

  const systemInstruction = `You are a Cognitive Science Learning Specialist designing Active Recall flashcards for college students.
Subject: ${subject}
Topic: ${topic}
Target Difficulty: ${difficulty}

ACTIVE RECALL FLASHCARD PRINCIPLES:
1. Front of card: Prompt an active cognitive retrieval step (a sharp question, diagnostic problem, or conceptual distinction). Never give away the answer in the prompt.
2. Back of card: Provide a crisp, definitive, and accurate answer (1-3 sentences maximum).
3. Explanation: Provide "Why It Matters / Exam Context" clarifying the underlying mechanism, invariant, or mnemonic.
4. High-Yield: Focus on high-frequency exam concepts, architectural differences, and tricky edge cases.`;

  const promptContent = `Generate ${count} active recall flashcards for ${subject} on ${topic}. Return structured JSON.`;

  try {
    const ai = getGeminiClient();
    const response = await generateContentWithFallback(ai, {
      contents: promptContent,
      eventName: 'flashcards_generate',
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Deck Title' },
            description: { type: Type.STRING, description: 'Short deck description' },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: 'Question or active recall prompt' },
                  back: { type: Type.STRING, description: 'Concise, accurate answer' },
                  explanation: {
                    type: Type.STRING,
                    description: 'Why it matters or mnemonic context for exams',
                  },
                  difficulty: {
                    type: Type.STRING,
                    enum: ['Easy', 'Medium', 'Hard'],
                    description: 'Card difficulty',
                  },
                },
                required: ['front', 'back', 'explanation', 'difficulty'],
              },
            },
          },
          required: ['title', 'description', 'cards'],
        },
      },
    });

    const parsed = safeParseJson<GeneratedFlashcardDeckResult>(response.text);
    if (parsed && Array.isArray(parsed.cards) && parsed.cards.length > 0) {
      aiCache.set(cacheKey, parsed, 1000 * 60 * 60);
      return parsed;
    }
  } catch (err: any) {
    console.warn('Gemini Flashcards call failed, engaging fallback deck:', err.message);
  }

  return getFallbackFlashcards(subject, topic, count);
}

function getFallbackFlashcards(
  subject: string,
  topic: string,
  count: number
): GeneratedFlashcardDeckResult {
  const cards: FlashcardItem[] = [
    {
      id: 'fc-1',
      front: 'What is the primary difference between Method Overloading and Method Overriding?',
      back: 'Overloading happens at compile-time (same method name with different parameter signatures); Overriding happens at runtime (subclass redefines a superclass method with the identical signature).',
      explanation:
        'Exam Tip: Overriding uses dynamic method dispatch on the object’s heap type, whereas overloading uses the reference type determined by the compiler.',
      difficulty: 'Easy',
    },
    {
      id: 'fc-2',
      front: 'Why is a Type 4 JDBC Driver known as a "Pure Java" Native Protocol driver?',
      back: 'Because it converts JDBC calls directly into the database vendor’s proprietary network protocol using pure Java sockets, with zero native OS binaries required.',
      explanation:
        'Why it matters: Eliminates deployment headaches and allows seamless execution across Linux, Windows, and container environments.',
      difficulty: 'Medium',
    },
    {
      id: 'fc-3',
      front: 'What happens when a subclass constructor does not explicitly invoke `super()`?',
      back: 'The Java compiler automatically inserts an implicit call to the superclass no-argument constructor `super();` as the very first statement.',
      explanation:
        'Common Trap: If the superclass defines only parameterized constructors and lacks a no-arg constructor, a compilation error occurs.',
      difficulty: 'Hard',
    },
    {
      id: 'fc-4',
      front: 'What is the purpose of PreparedStatement precompilation?',
      back: 'The database server parses, optimizes, and compiles the SQL query structure once, allowing parameters to be bound separately without recompilation.',
      explanation:
        'Why it matters: Dramatically speeds up repeated executions and completely prevents SQL injection attacks.',
      difficulty: 'Medium',
    },
  ];

  return {
    title: `${subject}: ${topic} Deck`,
    description: `High-yield active recall flashcard deck synthesized for ${topic}.`,
    cards: cards.slice(0, count),
  };
}

/* =========================================================================
   5. AI NOTES GENERATION & REFINEMENT SERVICE
   ========================================================================= */

export interface NoteGenerationParams {
  subject: string;
  topic: string;
  style: string;
  length: string;
  materialTitle?: string;
  materialCategory?: string;
  materialContent?: string;
  action?: 'generate' | 'shorter' | 'detailed' | 'regenerate';
  currentMarkdown?: string;
}

export interface GeneratedNoteResult {
  title: string;
  topic: string;
  summary: string;
  readTimeMin: number;
  tags: string[];
  contentMarkdown: string;
  keyTakeaways: string[];
  keyFormulas?: Array<{ name: string; formula: string; explanation: string }>;
}

export async function generateNotes(
  params: NoteGenerationParams
): Promise<GeneratedNoteResult> {
  const subject = params.subject || 'Java Programming & OOP';
  const topic = sanitizeInput(params.topic || 'Core Topic', 200);
  const style = params.style || 'Quick Revision';
  const length = params.length || 'Medium';
  const materialTitle = params.materialTitle || 'Course Material';
  const materialCategory = params.materialCategory || 'Lecture Notes';
  const materialContent = params.materialContent || '';
  const action = params.action || 'generate';
  const currentMarkdown = params.currentMarkdown || '';

  const cacheKey = `notes:${subject}:${topic}:${style}:${length}:${action}`;
  if (!currentMarkdown && action === 'generate') {
    const cached = aiCache.get<GeneratedNoteResult>(cacheKey);
    if (cached) {
      aiTelemetry.record({
        event: 'notes_generate',
        success: true,
        durationMs: 2,
        cached: true,
      });
      return cached;
    }
  }

  const systemInstruction = `You are an expert university professor and pedagogical note synthesis engine for college students in ${subject}.
Your mission is to transform academic study materials, lecture handouts, and textbooks into structured, easy-to-revise notes.

Pedagogical Directives:
1. Source Material Context: You are given the title (${materialTitle}), category (${materialCategory}), and excerpt content of the student's selected study material.
2. Grounding & Fidelity:
   - PRIORITIZE information directly from the provided study material.
   - Avoid inventing information or introducing ungrounded claims.
   - If a specific concept or section is not covered in the source material, clearly indicate: *(Not detailed in source material)* or omit irrelevant subsections.
   - Preserve exact academic terminology, variable names, formula conventions, and class/method names.
   - Organize all information logically with crisp hierarchy.

Style: "${style}"
- "Quick Revision": High-density, high-yield bullet points, compact tables, quick recall triggers.
- "Detailed Notes": Comprehensive breakdowns, in-depth architectural/theoretical analysis, step-by-step mechanisms.
- "Exam Notes": High-yield exam traps, frequent examiner questions, scoring rubrics, past paper patterns.
- "Beginner Friendly": Crystal-clear intuition, plain English, relatable everyday analogies, jargon demystification.

Length: "${length}"
- "Short": Concise, summary-focused, quick 3-4 minute read.
- "Medium": Balanced, thorough yet fast to review (6-8 min read).
- "Detailed": Exhaustive deep dive covering edge cases, proof sketches, or code walkthroughs (10-15 min read).

${action === 'shorter' ? 'Refinement: The user requested to MAKE THIS NOTE SHORTER. Distill the existing note into ultra-dense, high-impact bullet points while keeping the required headings.' : ''}
${action === 'detailed' ? 'Refinement: The user requested to MAKE THIS NOTE MORE DETAILED. Expand deeply on theoretical foundations, step-by-step code/calculation mechanisms, and subtle exam edge cases.' : ''}

Required Note Structure:
You MUST format the "contentMarkdown" field using this exact hierarchy:
# ${topic}

## Simple Explanation
(Plain-language overview explaining the what, why, and fundamental intuition.)

## Key Concepts
(Core principles and mechanisms organized with bullet points or bold subheadings.)

## Important Definitions
(Clear definitions of key terms and vocabulary from the material.)

## Examples
(Concrete code snippets, worked mathematical problems, reaction schemes, or realistic scenarios.)

## Important Points to Remember
(Crucial invariants, properties, formulas, and rules.)

## Exam Tips
(High-scoring advice, past exam patterns, what professors look for.)

## Common Mistakes
(Frequent student misconceptions, pitfalls, syntax/logic traps.)

## Quick Revision
(Fast active recall checklist / summary bullet points for right before an exam.)`;

  let promptContent = `Generate structured study notes on:
Subject: ${subject}
Topic / Chapter: ${topic}
Note Style: ${style}
Target Length: ${length}
Source Document Title: ${materialTitle} (${materialCategory})

Source Document Content:
"""
${materialContent ? materialContent.slice(0, 8000) : `Topic: ${topic}\nSubject: ${subject}\nCategory: ${materialCategory}`}
"""
`;

  if (currentMarkdown && (action === 'shorter' || action === 'detailed')) {
    promptContent += `\nCurrent Existing Note Markdown:\n"""\n${currentMarkdown.slice(0, 5000)}\n"""\n`;
  }

  promptContent += `\nPlease generate the note adhering strictly to the JSON schema with contentMarkdown and structured sections.`;

  try {
    const ai = getGeminiClient();
    const response = await generateContentWithFallback(ai, {
      contents: promptContent,
      eventName: 'notes_generate',
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Note title' },
            topic: { type: Type.STRING, description: 'Specific topic name' },
            summary: { type: Type.STRING, description: '2-3 sentence high-yield summary' },
            readTimeMin: { type: Type.INTEGER, description: 'Estimated read time in minutes' },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 5 relevant tags',
            },
            contentMarkdown: {
              type: Type.STRING,
              description: 'Complete formatted markdown text containing all # and ## sections',
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 4 must-know bullet points for exams',
            },
            keyFormulas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  formula: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['name', 'formula', 'explanation'],
              },
              description: 'Key formulas or invariant rules extracted from the material',
            },
          },
          required: ['title', 'topic', 'summary', 'contentMarkdown', 'keyTakeaways'],
        },
      },
    });

    const parsed = safeParseJson<GeneratedNoteResult>(response.text);
    if (parsed && parsed.contentMarkdown && parsed.title) {
      if (!currentMarkdown && action === 'generate') {
        aiCache.set(cacheKey, parsed, 1000 * 60 * 60);
      }
      return parsed;
    }
  } catch (err: any) {
    console.warn('Gemini Notes call failed, engaging academic fallback notes:', err.message);
  }

  return getFallbackNotes(subject, topic, style, length, materialTitle);
}

function getFallbackNotes(
  subject: string,
  topic: string,
  style: string,
  length: string,
  materialTitle: string
): GeneratedNoteResult {
  const readTime = length === 'Short' ? 3 : length === 'Detailed' ? 10 : 6;

  let contentMarkdown = '';
  if (length === 'Short') {
    contentMarkdown = `# ${topic}

## Simple Explanation
**${topic}** in ${subject} defines core operational rules, data encapsulation invariants, and deterministic execution contracts.

## Key Concepts
* **Contract Specification**: Establishes formal preconditions, invariants, and postconditions.
* **Dynamic Resolution**: Runtime dispatch resolves concrete behavioral implementations based on heap instance identity.
* **Encapsulation Boundaries**: Visibility modifiers protect internal state transitions.

## Important Definitions
* **Polymorphism**: The capacity for an operation to exhibit varying concrete execution behaviors based on the runtime receiver type.
* **Invariant**: A condition that remains unconditionally true throughout the lifetime of the component or algorithm.

## Examples
\`\`\`java
// Operational Invariant Example
public class InvariantHandler {
    private int state;
    public void execute(int input) {
        if (input > 0) this.state += input;
    }
}
\`\`\`

## Important Points to Remember
* Subclass constructors always invoke superclass initialization first.
* Always enforce defensive parameter checks at public API boundaries.

## Exam Tips
* Watch for execution sequence order in constructor chaining.

## Common Mistakes
* Confusing compile-time reference type bounds with runtime heap object dispatch.

## Quick Revision
* Validate bounds • Preserve invariants • Minimize coupling • Prefer composition.`;
  } else {
    contentMarkdown = `# ${topic}

## Simple Explanation
In ${subject}, **${topic}** represents a cornerstone paradigm. It decouples high-level interface abstraction from low-level concrete execution, enabling modular architectures, seamless testing, and maintainable enterprise software.

## Key Concepts
* **Generalization vs Specialization**: Base abstractions define contracts; specialized implementations provide domain refinements.
* **Virtual Method Resolution**: Compilers verify reference signatures; runtimes inspect vtables for target method pointers.
* **Liskov Substitution Principle**: Any caller depending on a base contract must function correctly when substituted with any derived subtype.

## Important Definitions
* **Superclass / Base Contract**: The abstraction defining shared invariants.
* **Subclass / Derived Implementation**: The concrete entity specializing behavioral logic.
* **Dynamic Dispatch**: Runtime mechanism binding method invocations to the actual instantiated type.

## Examples
\`\`\`java
public abstract class Account {
    protected double balance;
    public Account(double balance) { this.balance = balance; }
    public abstract void applyMonthlyInterest();
}
public class SavingsAccount extends Account {
    public SavingsAccount(double bal) { super(bal); }
    @Override
    public void applyMonthlyInterest() { this.balance *= 1.05; }
}
\`\`\`

## Important Points to Remember
* If the base class lacks a zero-arg constructor, child constructors must explicitly invoke \`super(args)\`.
* \`final\` modifier on methods prevents override; on classes it halts inheritance hierarchy.

## Exam Tips
* Trace the **reference type** for compile-time method accessibility, but inspect the **object type** on the heap for the actual runtime method executed.

## Common Mistakes
* Fragile base classes resulting from deep, tightly coupled inheritance hierarchies.
* Neglecting superclass constructor execution sequence.

## Quick Revision
1. Inheritance: Code reuse and polymorphism via subtype relationship.
2. Invariants: Preconditions must hold before state mutation.
3. Super(): Always statement #1 in derived constructors.`;
  }

  return {
    title: `${topic} (${style})`,
    topic,
    summary: `Structured academic note for ${topic} in ${subject}, synthesized with ${style} focus and ${length} depth.`,
    readTimeMin: readTime,
    tags: [subject.slice(0, 6).toUpperCase(), topic.split(' ')[0], style.replace(' ', '')],
    contentMarkdown,
    keyTakeaways: [
      `Foundational invariants and rules of ${topic}.`,
      'Dynamic runtime execution mechanics vs compile-time guarantees.',
      'Access modifiers, scope boundaries, and error traps for exams.',
    ],
    keyFormulas: [
      {
        name: 'Dynamic Method Dispatch Resolution',
        formula: 'vtable[Method_Offset] -> Concrete_Runtime_Implementation',
        explanation: 'JVM/runtime resolves method execution based on heap object type.',
      },
    ],
  };
}

/* =========================================================================
   6. ADAPTIVE STUDY RECOMMENDATIONS (Evidence-Based Weakness Engine)
   ========================================================================= */

export interface StudyRecommendationsParams {
  weakTopics?: any[];
  subject?: string;
  upcomingExams?: any[];
}

export interface StudyRecommendationResult {
  title: string;
  strugglingWith: string;
  whyDifficult: string;
  whatToDoNext: string;
  recommendedActivity: string;
  primaryTopic: string;
  primarySubject: string;
  actionType: 'tutor' | 'quiz' | 'flashcards' | 'notes';
  estimatedTimeMinutes: number;
}

export async function generateStudyRecommendations(
  params: StudyRecommendationsParams
): Promise<StudyRecommendationResult> {
  const weakTopics = Array.isArray(params.weakTopics) ? params.weakTopics : [];
  const subject = sanitizeInput(params.subject || 'ALL', 50);
  const upcomingExams = Array.isArray(params.upcomingExams) ? params.upcomingExams : [];

  if (weakTopics.length === 0) {
    return {
      title: 'Great Study Progress',
      strugglingWith: 'No critical weak topics identified yet.',
      whyDifficult: 'You currently have strong scores or haven’t taken enough quizzes/flashcards to flag weak areas.',
      whatToDoNext: 'Complete a diagnostic quiz or review flashcards across your subjects to reveal target review areas.',
      recommendedActivity: 'Take a mixed diagnostic quiz to baseline your knowledge.',
      primaryTopic: 'General Review',
      primarySubject: subject !== 'ALL' ? subject : 'JAVA',
      actionType: 'quiz',
      estimatedTimeMinutes: 10,
    };
  }

  // Multi-Factor Priority Sorting: Exam Urgency + Score Weakness + Mastery
  const scoredTopics = weakTopics.map((t: any) => {
    let score = 0;
    const avgScore = t.averageQuizScore ?? t.accuracyRate ?? null;
    const mastery = t.flashcardMasteryPercent ?? null;
    const attempts = t.quizAttempts || 0;
    const reviewed = t.flashcardsReviewed || 0;

    // 1. Weakness factor
    if (avgScore !== null && avgScore < 50) score += 35;
    else if (avgScore !== null && avgScore < 70) score += 20;

    if (mastery !== null && mastery < 50) score += 25;
    else if (mastery !== null && mastery < 70) score += 15;

    // 2. Exam Urgency factor
    const daysUntilExam = t.daysUntilExam ?? t.examUrgencyDays;
    if (daysUntilExam !== undefined && daysUntilExam !== null) {
      if (daysUntilExam <= 7) score += 40;
      else if (daysUntilExam <= 14) score += 25;
      else if (daysUntilExam <= 30) score += 15;
    } else {
      // Check upcoming exams array
      const matchedExam = upcomingExams.find(
        (e: any) =>
          e.subject?.code === t.subjectCode ||
          e.subjectCode === t.subjectCode ||
          e.code === t.subjectCode
      );
      if (matchedExam) {
        const days = matchedExam.daysLeft ?? matchedExam.daysUntilExam;
        if (days !== undefined && days !== null) {
          if (days <= 7) score += 40;
          else if (days <= 14) score += 25;
          else if (days <= 30) score += 15;
        }
      }
    }

    // 3. Priority tag boost
    if (t.priority === 'HIGH' || t.priority === 'High') score += 20;
    else if (t.priority === 'MEDIUM' || t.priority === 'Medium') score += 10;

    return { topic: t, priorityScore: score };
  });

  scoredTopics.sort((a, b) => b.priorityScore - a.priorityScore);
  const targetTopic = scoredTopics[0]?.topic || weakTopics[0];

  const startTime = Date.now();
  let ai = null;
  try {
    ai = getGeminiClient();
  } catch (err: any) {
    console.warn('Gemini client not initialized for recommendations:', err.message);
  }

  if (ai) {
    try {
      const systemInstruction = `You are an academic learning coach and adaptive study advisor for university students.
Your job is to examine the student's actual quiz, flashcard, and exam timeline metrics to provide a concise, highly actionable "Recommended Next Step".

Directives:
1. Identify specifically what the student is struggling with based on the data.
2. Explain why it is difficult based on their quiz mistakes, accuracy percentage, and flashcard mastery.
3. If an exam is approaching within 7-14 days, incorporate the exam urgency into the reason and recommendation.
4. Provide a clear, immediate study instruction on what the student should do next.
5. Recommend a concrete practice activity (e.g., a 5-question quiz drill, reviewing flashcards, or asking the AI Tutor to break down the concept).
6. Strict constraint: Keep the recommendation concise, professional, encouraging, and actionable. Do NOT diagnose learning disabilities or make unsupported psychological claims.
7. Return structured JSON matching the schema.`;

      const prompt = `Student Performance Summary:
Course Filter: ${subject}
Top Weak Topics:
${JSON.stringify(weakTopics.slice(0, 5), null, 2)}

Target Focus Topic:
${JSON.stringify(targetTopic, null, 2)}

Generate a personalized "Recommended Next Step" for this student.`;

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
                description: 'Why this concept is tricky based on their actual performance metrics and exam urgency',
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

      const parsed = safeParseJson<StudyRecommendationResult>(response.text);
      if (parsed && parsed.strugglingWith && parsed.whatToDoNext) {
        aiTelemetry.record({
          event: 'recommendations_generate',
          success: true,
          durationMs: Date.now() - startTime,
        });
        return parsed;
      }
    } catch (apiErr: any) {
      console.warn('Gemini recommendation API error, engaging algorithmic fallback:', apiErr.message);
    }
  }

  // Algorithmic Fallback based on real performance data & exam urgency
  const topicName = targetTopic.topic || targetTopic.topicName || 'Core Fundamentals';
  const subjCode = targetTopic.subjectCode || (subject !== 'ALL' ? subject : 'ADV-JAVA');
  const score = targetTopic.averageQuizScore ?? targetTopic.accuracyRate ?? 45;
  const flashcardPct = targetTopic.flashcardMasteryPercent ?? 40;
  const incorrectCount = targetTopic.quizIncorrectAnswers ?? 5;
  const needReview = targetTopic.flashcardsNeedingReview ?? 4;
  const daysUntilExam = targetTopic.daysUntilExam ?? targetTopic.examUrgencyDays;

  let reasonDetail = `Your average quiz accuracy is ${score}% (with ${incorrectCount} incorrect answers across recent attempts) and flashcard mastery is ${flashcardPct}%.`;
  if (targetTopic.reason) {
    reasonDetail = targetTopic.reason;
  }
  if (daysUntilExam !== undefined && daysUntilExam <= 14) {
    reasonDetail = `With your exam in ${daysUntilExam} day${daysUntilExam === 1 ? '' : 's'}, this topic requires urgent attention. ${reasonDetail}`;
  }

  return {
    title: `Target Review: ${topicName}`,
    strugglingWith: `${topicName} fundamentals and key exam principles in ${subjCode}.`,
    whyDifficult: `${reasonDetail} Core definitions, invariants, and edge cases frequently cause mistakes under exam conditions.`,
    whatToDoNext:
      score < 50
        ? `Review the core concepts in 'Ask My Notes' or AI Tutor to clarify foundational rules before testing again.`
        : `Review the ${needReview} flashcards marked for revision to solidify core definitions.`,
    recommendedActivity:
      score < 50
        ? `Ask AI Tutor to break down ${topicName} with step-by-step code and practical examples.`
        : `Complete a 5-question Practice Quiz on ${topicName} to reach >75% accuracy.`,
    primaryTopic: topicName,
    primarySubject: subjCode,
    actionType: score < 50 ? 'tutor' : 'quiz',
    estimatedTimeMinutes: 10,
  };
}

/* =========================================================================
   7. ADAPTIVE STUDY PLANNER (Data-Driven Schedules & Balances)
   ========================================================================= */

export interface StudyPlannerParams {
  preferences?: {
    dailyStudyMinutes?: number;
    sessionLengthMinutes?: number;
    breakLengthMinutes?: number;
    studyDays?: string[];
    preferredStudySlot?: string;
    startDate?: string;
    endDate?: string;
  };
  subjects?: any[];
  weakTopics?: any[];
  quizHistory?: any[];
  flashcardMastery?: any[];
  recentActivity?: any[];
  userMaterials?: any[];
  userId?: string;
}

export interface StudyPlanDayTask {
  id: string;
  subjectCode: string;
  subjectName: string;
  topic: string;
  activityType:
    | 'AI Tutor'
    | 'Practice Quiz'
    | 'Flashcards'
    | 'Notes'
    | 'Study Material Review'
    | 'Learn'
    | 'Review'
    | 'Mock Test'
    | 'Break';
  durationMinutes: number;
  reason: string;
  isBreak: boolean;
  completed: boolean;
  targetAction?: 'tutor' | 'quiz' | 'flashcards' | 'notes' | 'materials';
}

export interface StudyPlanDay {
  date: string;
  dayName: string;
  priority: 'High' | 'Medium' | 'Standard';
  summary: string;
  tasks: StudyPlanDayTask[];
}

export interface GeneratedStudyPlanResult {
  title: string;
  startDate: string;
  endDate: string;
  dailyMinutes: number;
  sessionLengthMinutes: number;
  totalTasks: number;
  totalEstimatedHours: number;
  prioritySubjects: any[];
  adaptationInsights: string[];
  days: StudyPlanDay[];
}

export async function generateStudyPlan(
  params: StudyPlannerParams
): Promise<GeneratedStudyPlanResult> {
  const {
    preferences,
    subjects = [],
    weakTopics = [],
    quizHistory = [],
    flashcardMastery = [],
    recentActivity = [],
    userMaterials = [],
  } = params;

  const dailyMinutes = Number(preferences?.dailyStudyMinutes) || 120;
  const sessionLength = Number(preferences?.sessionLengthMinutes) || 45;
  const studyDays =
    Array.isArray(preferences?.studyDays) && preferences.studyDays.length > 0
      ? preferences.studyDays
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const today = new Date();
  const startDateStr = preferences?.startDate || today.toISOString().split('T')[0];

  let endDateStr = preferences?.endDate;
  if (!endDateStr) {
    const end = new Date(startDateStr);
    end.setDate(end.getDate() + 7);
    endDateStr = end.toISOString().split('T')[0];
  }

  // Step 1: Calculate Real Priority for each subject based on actual data
  const nowMs = new Date(startDateStr).getTime();
  const prioritySubjects = subjects.map((subj: any) => {
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

    const subjWeakTopics = weakTopics.filter((w: any) => w.subjectCode === subj.code);
    const subjQuizzes = quizHistory.filter((q: any) => q.subjectCode === subj.code);
    const subjFlashcards = flashcardMastery.filter((f: any) => f.subjectCode === subj.code);

    let avgQuizScore: number | null = null;
    if (subjQuizzes.length > 0) {
      const totalScore = subjQuizzes.reduce(
        (acc: number, q: any) => acc + (Number(q.scorePercent) || 0),
        0
      );
      avgQuizScore = Math.round(totalScore / subjQuizzes.length);
    } else if (subjWeakTopics.some((w: any) => w.averageQuizScore !== null && w.averageQuizScore !== undefined)) {
      const scored = subjWeakTopics.filter(
        (w: any) => w.averageQuizScore !== null && w.averageQuizScore !== undefined
      );
      const sum = scored.reduce((acc: number, w: any) => acc + Number(w.averageQuizScore), 0);
      avgQuizScore = Math.round(sum / scored.length);
    }

    let flashMastery: number | null = null;
    if (subjFlashcards.length > 0) {
      const sum = subjFlashcards.reduce(
        (acc: number, f: any) => acc + (Number(f.masteryPercent) || 0),
        0
      );
      flashMastery = Math.round(sum / subjFlashcards.length);
    }

    let priorityScore = 0;
    const reasonParts: string[] = [];

    if (isExamPassed) {
      priorityScore = 0;
      reasonParts.push('Exam has passed');
    } else {
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

      if (subjWeakTopics.length > 0) {
        priorityScore += Math.min(25, subjWeakTopics.length * 8);
        reasonParts.push(`${subjWeakTopics.length} weak topic(s) needing review`);
      }

      const progress = Number(subj.progressPercent) || 0;
      if (progress < 25) {
        priorityScore += 15;
        reasonParts.push('Low course progress');
      } else if (progress < 60) {
        priorityScore += 8;
      }

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
      priorityRank: 0,
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

  prioritySubjects.sort((a: any, b: any) => b.priorityScore - a.priorityScore);
  prioritySubjects.forEach((p: any, idx: number) => {
    p.priorityRank = idx + 1;
  });

  const activeSubjects = prioritySubjects.filter((p: any) => !p.isExamPassed);
  const subjectPool = activeSubjects.length > 0 ? activeSubjects : prioritySubjects;

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

  let generatedPlanDays: StudyPlanDay[] | null = null;
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
5. Activity types allowed: "Learn", "Review", "AI Tutor", "Practice Quiz", "Flashcards", "Notes", "Study Material Review", "Mock Test", "Break".
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

    const parsed = safeParseJson<{ adaptationInsights?: string[]; days?: StudyPlanDay[] }>(
      response.text
    );
    if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
      generatedPlanDays = parsed.days;
      if (Array.isArray(parsed.adaptationInsights)) {
        adaptationInsights = parsed.adaptationInsights;
      }
    }
  } catch (geminiErr: any) {
    console.warn(
      'Gemini Study Planner generation notice, switching to deterministic academic engine:',
      geminiErr.message
    );
  }

  // Algorithmic Fallback Engine if Gemini was unavailable
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

      const dayTasks: StudyPlanDayTask[] = [];
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

  // Post-process and validate day totals
  let totalPlannedMinutes = 0;
  let totalTasksCount = 0;

  const validatedDays = generatedPlanDays.map((day: any, dIdx: number) => {
    let dayMinutes = 0;
    const validTasks = (day.tasks || []).map((task: any, tIdx: number) => {
      const duration = Number(task.durationMinutes) || 30;
      dayMinutes += duration;
      totalTasksCount += 1;
      return {
        id: task.id || `task-${day.date || dIdx}-${tIdx + 1}`,
        subjectCode: task.subjectCode || subjectPool[0]?.subjectCode || 'ADV-JAVA',
        subjectName: task.subjectName || subjectPool[0]?.subjectName || 'Advance Java',
        topic: task.topic || 'Core Module Revision',
        activityType: task.activityType || 'Learn',
        durationMinutes: duration,
        reason: task.reason || 'Syllabus requirement and examination alignment.',
        isBreak: Boolean(task.isBreak),
        completed: Boolean(task.completed),
        targetAction: task.targetAction || (task.isBreak ? undefined : 'tutor'),
      };
    });

    totalPlannedMinutes += dayMinutes;
    return {
      date: day.date || planDates[dIdx]?.dateStr || startDateStr,
      dayName: day.dayName || planDates[dIdx]?.formattedName || `Day ${dIdx + 1}`,
      priority: day.priority || 'Medium',
      summary: day.summary || `Dedicated study block for ${day.tasks?.[0]?.subjectName || 'coursework'}`,
      tasks: validTasks,
    };
  });

  return {
    title: `Adaptive Study Plan (${planDates.length} Days)`,
    startDate: startDateStr,
    endDate: endDateStr,
    dailyMinutes,
    sessionLengthMinutes: sessionLength,
    totalTasks: totalTasksCount,
    totalEstimatedHours: +(totalPlannedMinutes / 60).toFixed(1),
    prioritySubjects,
    adaptationInsights,
    days: validatedDays,
  };
}


