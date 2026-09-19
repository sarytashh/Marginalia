import { randomBytes, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../lib/database.types";
import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
} from "../lib/supabase/env";

type TableClient = SupabaseClient<Database>;

const EMBEDDING_DIMENSIONS = 1024;
const ZERO_EMBEDDING = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);

async function main() {
  const { url, anonKey } = getSupabasePublicEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  const admin = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const stamp = randomUUID().slice(0, 8);
  const password = randomBytes(24).toString("base64url");
  const emailA = `rls-a-${stamp}@marginalia.invalid`;
  const emailB = `rls-b-${stamp}@marginalia.invalid`;
  const createdUserIds: string[] = [];
  const createdDocumentIds: string[] = [];

  try {
    const userA = await createConfirmedUser(admin, emailA, password);
    const userB = await createConfirmedUser(admin, emailB, password);
    createdUserIds.push(userA, userB);

    const seeded = await seedOwnedMaterial(admin, userA);
    createdDocumentIds.push(seeded.documentId);

    const clientA = await signInUser(url, anonKey, emailA, password);
    const clientB = await signInUser(url, anonKey, emailB, password);
    const anon = createClient<Database>(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const aAsA = await countOwnedRows(clientA, seeded, "owner");
    const aAsB = await countOwnedRows(clientB, seeded, "other account");
    const aAsAnon = await countOwnedRows(anon, seeded, "signed-out client");

    const failures: string[] = [];

    if (aAsA.documents !== 1) {
      failures.push(`Owner could not read their document (got ${aAsA.documents}).`);
    }
    if (aAsA.chunks !== 1) {
      failures.push(`Owner could not read their chunks (got ${aAsA.chunks}).`);
    }
    if (aAsA.questions !== 1) {
      failures.push(`Owner could not read their questions (got ${aAsA.questions}).`);
    }
    if (aAsA.attempts !== 1) {
      failures.push(`Owner could not read their attempts (got ${aAsA.attempts}).`);
    }

    for (const [label, counts] of [
      ["other account", aAsB],
      ["signed-out client", aAsAnon],
    ] as const) {
      if (counts.documents !== 0) {
        failures.push(`${label} read ${counts.documents} of the owner's documents.`);
      }
      if (counts.chunks !== 0) {
        failures.push(`${label} read ${counts.chunks} of the owner's chunks.`);
      }
      if (counts.questions !== 0) {
        failures.push(`${label} read ${counts.questions} of the owner's questions.`);
      }
      if (counts.attempts !== 0) {
        failures.push(`${label} read ${counts.attempts} of the owner's attempts.`);
      }
    }

    if (failures.length > 0) {
      for (const failure of failures) {
        console.error(failure);
      }
      process.exitCode = 1;
      return;
    }

    console.log(
      "RLS holds: a second account and a signed-out client both received 0 rows for the owner's documents, chunks, questions, and attempts. The owner still sees their own rows.",
    );
  } finally {
    for (const documentId of createdDocumentIds) {
      const { error } = await admin.from("documents").delete().eq("id", documentId);
      if (error) {
        console.error("Could not delete a verification document.");
      }
    }
    for (const userId of createdUserIds) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) {
        console.error("Could not delete a verification user.");
      }
    }
  }
}

async function createConfirmedUser(
  admin: TableClient,
  email: string,
  password: string,
): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || data.user === null) {
    throw new Error("Could not create a verification user.");
  }
  return data.user.id;
}

async function signInUser(
  url: string,
  anonKey: string,
  email: string,
  password: string,
): Promise<TableClient> {
  const client = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || data.session === null) {
    throw new Error(
      "Could not sign in a verification user. Enable the Email provider in Supabase Auth (password sign-in can stay hidden from the app UI).",
    );
  }
  return createClient<Database>(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function seedOwnedMaterial(
  admin: TableClient,
  userId: string,
): Promise<{
  attemptId: string;
  chunkId: string;
  documentId: string;
  questionId: string;
}> {
  const documentId = randomUUID();
  const chunkId = randomUUID();
  const topicId = randomUUID();
  const questionId = randomUUID();
  const attemptId = randomUUID();

  const document = await admin.from("documents").insert({
    id: documentId,
    user_id: userId,
    title: "RLS verification",
    filename: "rls.pdf",
    storage_path: `${userId}/${documentId}/rls.pdf`,
    page_count: 1,
    status: "ready",
  });
  if (document.error) {
    throw new Error("Could not insert a verification document.");
  }

  const chunk = await admin.from("chunks").insert({
    id: chunkId,
    document_id: documentId,
    content: "A private passage used only to verify row level security.",
    page_number: 1,
    token_count: 12,
    embedding: ZERO_EMBEDDING,
  });
  if (chunk.error) {
    throw new Error("Could not insert a verification chunk.");
  }

  const topic = await admin.from("topics").insert({
    id: topicId,
    document_id: documentId,
    name: "Row level security",
    summary: "Used only to verify that another account cannot read this topic.",
  });
  if (topic.error) {
    throw new Error("Could not insert a verification topic.");
  }

  const question = await admin.from("questions").insert({
    id: questionId,
    document_id: documentId,
    topic_id: topicId,
    kind: "short_answer",
    prompt: "What does this private passage contain?",
    reference_answer: "A passage used to verify row level security.",
    source_chunk_ids: [chunkId],
    difficulty: 1,
  });
  if (question.error) {
    throw new Error("Could not insert a verification question.");
  }

  const attempt = await admin.from("attempts").insert({
    id: attemptId,
    question_id: questionId,
    user_id: userId,
    user_answer: "A private check.",
    score: 1,
  });
  if (attempt.error) {
    throw new Error("Could not insert a verification attempt.");
  }

  return { attemptId, chunkId, documentId, questionId };
}

async function countOwnedRows(
  client: TableClient,
  ids: {
    attemptId: string;
    chunkId: string;
    documentId: string;
    questionId: string;
  },
  role: "owner" | "other account" | "signed-out client",
): Promise<{
  attempts: number;
  chunks: number;
  documents: number;
  questions: number;
}> {
  const [documents, chunks, questions, attempts] = await Promise.all([
    client.from("documents").select("id").eq("id", ids.documentId),
    client.from("chunks").select("id").eq("id", ids.chunkId),
    client.from("questions").select("id").eq("id", ids.questionId),
    client.from("attempts").select("id").eq("id", ids.attemptId),
  ]);

  return {
    documents: countResult(documents, role, "documents"),
    chunks: countResult(chunks, role, "chunks"),
    questions: countResult(questions, role, "questions"),
    attempts: countResult(attempts, role, "attempts"),
  };
}

function countResult(
  result: {
    data: { id: string }[] | null;
    error: { code?: string; message: string } | null;
  },
  role: "owner" | "other account" | "signed-out client",
  table: string,
): number {
  if (result.error === null) {
    return result.data?.length ?? 0;
  }

  if (role !== "owner" && isDenied(result.error)) {
    return 0;
  }

  throw new Error(
    `${role} could not query ${table} (${result.error.code ?? "unknown"}).`,
  );
}

function isDenied(error: { code?: string; message: string }): boolean {
  return (
    error.code === "42501" ||
    error.code === "PGRST301" ||
    error.code === "PGRST302" ||
    /permission denied|not authorized|jwt/i.test(error.message)
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Row-level security check failed.";
  console.error(message);
  process.exitCode = 1;
});
