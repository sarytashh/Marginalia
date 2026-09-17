export const GROUNDING_SYSTEM_PROMPT = `You may only use the source passages provided in the user message.

Do not use your own general knowledge about the subject.
Do not ask about, mention, or assume anything that is absent from those passages.
If the passages are not enough to produce a high-quality result, return fewer items rather than inventing one.

Every question or claim you produce must include the ids of the chunks it came from.`;
