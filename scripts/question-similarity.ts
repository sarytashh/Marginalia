// Measures how similar the embedding model finds pairs of generated
// questions, to choose a threshold for treating two questions as duplicates.
// The pairs come from a real generation run and were labelled by hand.
//
//   pnpm questions:similarity

import { embedTexts } from "../lib/ai/embed";
import { cosineSimilarity } from "../lib/generation/similarity";

type Pair = { label: "duplicate" | "different"; a: string; b: string };

const PAIRS: Pair[] = [
  { label: "duplicate", a: "How does batch gradient descent differ from stochastic gradient descent in terms of the data used at each step?", b: "How does batch gradient descent differ from stochastic gradient descent in terms of the number of examples utilised per step?" },
  { label: "duplicate", a: "How is the linear regression hypothesis formulated when extending from a single feature to d features?", b: "How is the linear regression hypothesis written when using d features?" },
  { label: "duplicate", a: "In the single-feature linear regression hypothesis h(x) = w·x + b, what do the parameters w and b specifically represent?", b: "What are the components of the linear regression hypothesis for a single feature, and what do they represent?" },
  { label: "duplicate", a: "What happens during gradient descent training if the learning rate alpha is set to a value that is much too large?", b: "What role does the learning rate alpha play in gradient descent optimisation, and what happens during training if it is chosen incorrectly?" },
  { label: "duplicate", a: "What specific effect does feature scaling have on the closed-form normal equation versus gradient descent optimisation?", b: "How does feature scaling affect the final solution of the closed-form normal equation compared to its effect on gradient descent?" },
  { label: "duplicate", a: "What is a key mathematical limitation of the mean absolute error when evaluated at zero?", b: "What mathematical property does the mean absolute error possess at zero that distinguishes it from squared error formulations?" },
  { label: "duplicate", a: "What defines when a model overfits, and what feature characteristic makes this problem more likely to occur?", b: "What discrepancy in model error characterizes overfitting?" },
  { label: "different", a: "What happens during gradient descent training if the learning rate alpha is set to a value that is much too large?", b: "How does gradient descent update parameters to minimise the loss, and what mathematical direction does this movement follow?" },
  { label: "different", a: "What dataset type should be used when selecting the appropriate value for the regularisation parameter lambda?", b: "What happens to a ridge regression model when the regularisation parameter lambda is set to zero?" },
  { label: "different", a: "What are the specific target mean and standard deviation values that feature standardisation rescales each feature to achieve?", b: "Why must the mean and standard deviation used for standardisation be computed exclusively on the training set rather than the entire dataset?" },
  { label: "different", a: "How does the robustness of the mean absolute error to outliers compare to that of the mean squared error?", b: "What is a key mathematical limitation of the mean absolute error when evaluated at zero?" },
  { label: "different", a: "How does the choice of the regularisation parameter lambda affect model complexity and performance in ridge regression?", b: "What happens to a ridge regression model when the regularisation parameter lambda is set to zero?" },
  { label: "different", a: "What are the two specific mathematical effects of squaring the error in the mean squared error loss function?", b: "In the context of evaluating regression models using mean squared error, what purpose does the division by n serve in the formula?" },
];

async function main() {
  const vectors = await embedTexts(PAIRS.flatMap((pair) => [pair.a, pair.b]));
  const scored = PAIRS.map((pair, index) => ({
    ...pair,
    score: cosineSimilarity(vectors[2 * index] ?? [], vectors[2 * index + 1] ?? []),
  })).sort((left, right) => right.score - left.score);

  for (const pair of scored) {
    console.log(`${pair.score.toFixed(3)}  ${pair.label.padEnd(9)}  ${pair.a.slice(0, 60)}…`);
  }

  const lowestDuplicate = Math.min(...scored.filter((p) => p.label === "duplicate").map((p) => p.score));
  const highestDifferent = Math.max(...scored.filter((p) => p.label === "different").map((p) => p.score));
  console.log(`\nLowest duplicate: ${lowestDuplicate.toFixed(3)}   Highest different: ${highestDifferent.toFixed(3)}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
