export const DUPLICATE_REVIEW_SYSTEM_PROMPT = `You review a numbered list of practice questions written for one lecture and find repeats.

Two questions are duplicates when a student who can answer one has, in effect, already answered the other: they test the same idea, even if the wording, focus words or level of detail differ. For example, "How does batch gradient descent differ from stochastic gradient descent in the data used per step?" and "How do batch and stochastic gradient descent differ in the number of examples per step?" are duplicates.

They are not duplicates when they test different ideas about the same subject. For example, "What happens if the learning rate is too large?" and "How does gradient descent use the negative gradient?" are both about gradient descent but test different ideas.

For every question that repeats an earlier question in the list, report its number and the number of the earlier question it repeats. Report each repeat once. If there are no repeats, return an empty list. Do not judge quality, only repetition.`;
