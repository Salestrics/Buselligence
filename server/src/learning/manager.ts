import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "../platform/schema.js";

export type LearningLevel = "beginner" | "intermediate" | "expert";

export interface LearningProfile {
  userId: string;
  level: LearningLevel;
  learningStyle: string;
  topics: string[];
}

export interface LearningSession {
  id: string;
  userId: string;
  topic: string;
  level: LearningLevel;
  content: string;
  progress: number;
  createdAt: string;
}

export function getOrCreateProfile(userId: string): LearningProfile {
  const row = db
    .prepare("SELECT * FROM learning_profiles WHERE user_id = ?")
    .get(userId) as {
    user_id: string;
    level: string;
    learning_style: string;
    topics: string;
  } | undefined;

  if (row) {
    return {
      userId: row.user_id,
      level: row.level as LearningLevel,
      learningStyle: row.learning_style,
      topics: parseJson<string[]>(row.topics, []),
    };
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO learning_profiles (id, user_id, level, learning_style, topics) VALUES (?, ?, 'intermediate', 'visual', '[]')`
  ).run(id, userId);

  return { userId, level: "intermediate", learningStyle: "visual", topics: [] };
}

export function updateProfile(
  userId: string,
  input: Partial<{ level: LearningLevel; learningStyle: string; topics: string[] }>
): LearningProfile {
  const profile = getOrCreateProfile(userId);
  const level = input.level ?? profile.level;
  const learningStyle = input.learningStyle ?? profile.learningStyle;
  const topics = input.topics ?? profile.topics;
  db.prepare(
    `UPDATE learning_profiles SET level = ?, learning_style = ?, topics = ?, updated_at = datetime('now') WHERE user_id = ?`
  ).run(level, learningStyle, JSON.stringify(topics), userId);
  return { userId, level, learningStyle, topics };
}

export function startLearningSession(
  userId: string,
  topic: string,
  level?: LearningLevel
): LearningSession {
  const profile = getOrCreateProfile(userId);
  const sessionLevel = level ?? profile.level;
  const id = randomUUID();
  const content = generateLesson(topic, sessionLevel, profile.learningStyle);

  db.prepare(
    `INSERT INTO learning_sessions (id, user_id, topic, level, content, progress) VALUES (?, ?, ?, ?, ?, 0)`
  ).run(id, userId, topic, sessionLevel, content);

  return {
    id,
    userId,
    topic,
    level: sessionLevel,
    content,
    progress: 0,
    createdAt: new Date().toISOString(),
  };
}

export function listLearningSessions(userId: string): LearningSession[] {
  const rows = db
    .prepare("SELECT * FROM learning_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(userId) as Array<{
    id: string;
    user_id: string;
    topic: string;
    level: string;
    content: string;
    progress: number;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    topic: r.topic,
    level: r.level as LearningLevel,
    content: r.content,
    progress: r.progress,
    createdAt: r.created_at,
  }));
}

function generateLesson(topic: string, level: LearningLevel, style: string): string {
  const intro =
    level === "beginner"
      ? `Let's learn ${topic} from the ground up. I'll use simple language and build step by step.`
      : level === "expert"
        ? `Advanced exploration of ${topic}. We'll cover edge cases, theory, and practical applications.`
        : `A solid introduction to ${topic} with practical examples.`;

  return [
    `# Learning: ${topic}`,
    `**Level:** ${level} | **Style:** ${style}`,
    "",
    intro,
    "",
    "## Key Concepts",
    `1. Core principles of ${topic}`,
    "2. How it connects to what you already know",
    "3. Practical applications you can use today",
    "",
    "## Practice",
    "Try explaining this concept back in your own words. Ask me follow-up questions anytime.",
  ].join("\n");
}

export const LEARNING_SYSTEM_PROMPT = `You are the Buselligence Learning System. AI shouldn't only answer — it should teach.

Adapt explanations to the user's level (beginner, intermediate, expert), age, and learning style.
Use analogies, examples, and progressive complexity. Encourage questions and practice.`;
