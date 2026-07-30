import type { TestCase } from '../lib/runCode'

export interface Exercise {
  id: string
  title: string
  /** One-line statement of what to implement. */
  prompt: string
  starterCode: string
  solution: string
  tests: TestCase[]
  hint?: string
  /** The file in the Python repo this mirrors. */
  repoRef?: string
}

export const exercises: Record<string, Exercise> = {
  softmax: {
    id: 'softmax',
    title: 'Implement softmax',
    prompt:
      'Turn a list of raw scores into a probability distribution. Subtract the max before exponentiating so large scores do not overflow.',
    repoRef: 'mini_transformer/model/attention.py',
    starterCode: `function softmax(scores) {
  // 1. find the max score (for numerical stability)
  // 2. exponentiate each (score - max)
  // 3. divide each by the sum of all exponentials
  return [];
}`,
    solution: `function softmax(scores) {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}`,
    hint: 'Math.max(...scores) gives the max. Subtracting it changes nothing mathematically — exp(a-m)/Σexp(b-m) equals exp(a)/Σexp(b) — but it keeps the numbers small.',
    tests: [
      {
        name: 'output sums to 1',
        code: `const out = softmax([2, 1, 0.5]);
assertClose(out.reduce((a, b) => a + b, 0), 1);`,
      },
      {
        name: 'equal scores give a uniform distribution',
        code: `assertArrayClose(softmax([0, 0, 0]), [1/3, 1/3, 1/3]);`,
      },
      {
        name: 'a higher score gets a higher weight',
        code: `const out = softmax([1, 3]);
assert(out[1] > out[0], 'the larger score should get the larger weight');`,
      },
      {
        name: 'stays stable for very large scores',
        code: `const out = softmax([1000, 1001]);
assert(Number.isFinite(out[0]) && Number.isFinite(out[1]), 'got NaN/Infinity — subtract the max first');
assertArrayClose(out, [0.2689414, 0.7310586], 1e-5);`,
      },
    ],
  },

  attentionRow: {
    id: 'attentionRow',
    title: 'Compute a single attention row',
    prompt:
      'Given one query and every key/value in the sequence, produce that token’s attention output: score, scale by √d_k, softmax, then take the weighted sum of the values.',
    repoRef: 'mini_transformer/model/attention.py',
    starterCode: `// softmax() from the previous exercise is already available.

function attentionRow(query, keys, values) {
  // 1. score = dot(query, key) for every key
  // 2. divide every score by Math.sqrt(query.length)
  // 3. weights = softmax(scores)
  // 4. return the weighted sum of the value vectors
  return [];
}`,
    solution: `function softmax(scores) {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function attentionRow(query, keys, values) {
  const dk = query.length;
  const scores = keys.map((k) => k.reduce((sum, kv, i) => sum + kv * query[i], 0) / Math.sqrt(dk));
  const weights = softmax(scores);
  return values[0].map((_, dim) =>
    weights.reduce((sum, w, j) => sum + w * values[j][dim], 0),
  );
}`,
    hint: 'The output has the same length as one value vector, not the same length as the sequence. Build it dimension by dimension.',
    tests: [
      {
        name: 'attends entirely to the only token',
        code: `assertArrayClose(attentionRow([1, 0], [[1, 0]], [[5, 7]]), [5, 7]);`,
      },
      {
        name: 'output is a convex mix of the values',
        code: `const out = attentionRow([1, 0], [[1, 0], [0, 1]], [[10, 0], [0, 10]]);
assertClose(out[0] + out[1], 10, 1e-4);
assert(out[0] > out[1], 'the query matches the first key, so value 0 should dominate');`,
      },
      {
        name: 'applies the 1/sqrt(d_k) scaling',
        code: `const out = attentionRow([1, 0], [[1, 0], [0, 1]], [[10, 0], [0, 10]]);
assertArrayClose(out, [6.69773, 3.30227], 1e-3);`,
      },
      {
        name: 'a stronger match shifts more weight',
        code: `const weak = attentionRow([1, 0], [[1, 0], [0, 1]], [[10, 0], [0, 10]]);
const strong = attentionRow([4, 0], [[1, 0], [0, 1]], [[10, 0], [0, 10]]);
assert(strong[0] > weak[0], 'a larger query-key dot product should concentrate attention');`,
      },
    ],
  },

  positionalEncoding: {
    id: 'positionalEncoding',
    title: 'Build a sinusoidal position vector',
    prompt:
      'Return the d_model-length encoding for one position. Even dimensions use sin, odd dimensions use cos, and the wavelength grows geometrically across dimension pairs.',
    repoRef: 'mini_transformer/model/positional.py',
    starterCode: `function positionalEncoding(pos, dModel) {
  // for each dimension index d:
  //   i = Math.floor(d / 2)
  //   angle = pos / Math.pow(10000, (2 * i) / dModel)
  //   even d -> Math.sin(angle), odd d -> Math.cos(angle)
  return [];
}`,
    solution: `function positionalEncoding(pos, dModel) {
  const out = [];
  for (let d = 0; d < dModel; d++) {
    const i = Math.floor(d / 2);
    const angle = pos / Math.pow(10000, (2 * i) / dModel);
    out.push(d % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
  }
  return out;
}`,
    hint: 'Dimensions pair up: d=0,1 share i=0; d=2,3 share i=1. Each pair gets its own frequency.',
    tests: [
      {
        name: 'position 0 is [0, 1, 0, 1, ...]',
        code: `assertArrayClose(positionalEncoding(0, 4), [0, 1, 0, 1]);`,
      },
      {
        name: 'returns dModel values',
        code: `assert(positionalEncoding(3, 16).length === 16, 'wrong length');`,
      },
      {
        name: 'position 1 matches the formula',
        code: `assertArrayClose(positionalEncoding(1, 4), [0.841471, 0.540302, 0.0099998, 0.99995], 1e-5);`,
      },
      {
        name: 'early dimensions change faster than later ones',
        code: `const a = positionalEncoding(1, 32);
const b = positionalEncoding(2, 32);
const fast = Math.abs(a[0] - b[0]);
const slow = Math.abs(a[30] - b[30]);
assert(fast > slow, 'low dimensions should oscillate faster than high ones');`,
      },
    ],
  },

  splitHeads: {
    id: 'splitHeads',
    title: 'Split a vector into attention heads',
    prompt:
      'Multi-head attention slices the d_model vector into numHeads equal chunks, each of size d_k = d_model / numHeads, and runs attention independently in each.',
    repoRef: 'mini_transformer/model/attention.py',
    starterCode: `function splitHeads(vec, numHeads) {
  // throw an Error if vec.length is not divisible by numHeads,
  // otherwise return numHeads consecutive slices of equal size
  return [];
}`,
    solution: `function splitHeads(vec, numHeads) {
  if (vec.length % numHeads !== 0) {
    throw new Error('d_model must be divisible by numHeads');
  }
  const dk = vec.length / numHeads;
  const heads = [];
  for (let h = 0; h < numHeads; h++) {
    heads.push(vec.slice(h * dk, (h + 1) * dk));
  }
  return heads;
}`,
    hint: 'Array.prototype.slice(start, end) does the chunking. d_k is vec.length / numHeads.',
    tests: [
      {
        name: 'splits 8 dims into 2 heads of 4',
        code: `const heads = splitHeads([1,2,3,4,5,6,7,8], 2);
assert(heads.length === 2, 'expected 2 heads');
assertArrayClose(heads[0], [1,2,3,4]);
assertArrayClose(heads[1], [5,6,7,8]);`,
      },
      {
        name: 'splits 4 dims into 4 heads of 1',
        code: `const heads = splitHeads([1,2,3,4], 4);
assert(heads.length === 4, 'expected 4 heads');
assertArrayClose(heads[2], [3]);`,
      },
      {
        name: 'rejects an indivisible split',
        code: `let threw = false;
try { splitHeads([1,2,3], 2); } catch (e) { threw = true; }
assert(threw, 'should throw when d_model is not divisible by numHeads');`,
      },
    ],
  },

  layerNorm: {
    id: 'layerNorm',
    title: 'Implement Add & Norm',
    prompt:
      'Write layerNorm (zero mean, unit variance across the vector) and then addNorm, which is exactly LayerNorm(x + sublayerOutput) — the residual connection plus normalization.',
    repoRef: 'mini_transformer/model/encoder.py',
    starterCode: `function layerNorm(vec, eps = 1e-5) {
  // 1. mean of vec
  // 2. variance of vec (average squared deviation from the mean)
  // 3. (v - mean) / Math.sqrt(variance + eps) for each v
  return [];
}

function addNorm(x, sublayerOut) {
  // add the residual, then normalize
  return [];
}`,
    solution: `function layerNorm(vec, eps = 1e-5) {
  const mean = vec.reduce((a, b) => a + b, 0) / vec.length;
  const variance = vec.reduce((a, b) => a + (b - mean) ** 2, 0) / vec.length;
  const denom = Math.sqrt(variance + eps);
  return vec.map((v) => (v - mean) / denom);
}

function addNorm(x, sublayerOut) {
  return layerNorm(x.map((v, i) => v + sublayerOut[i]));
}`,
    hint: 'Use the population variance (divide by n, not n-1). eps goes inside the square root to avoid dividing by zero.',
    tests: [
      {
        name: 'normalized output has zero mean',
        code: `const out = layerNorm([1, 2, 3, 4]);
assertClose(out.reduce((a, b) => a + b, 0) / out.length, 0, 1e-6);`,
      },
      {
        name: 'normalized output has unit variance',
        code: `const out = layerNorm([1, 2, 3, 4]);
const mean = out.reduce((a, b) => a + b, 0) / out.length;
const v = out.reduce((a, b) => a + (b - mean) ** 2, 0) / out.length;
assertClose(v, 1, 1e-4);`,
      },
      {
        name: 'layerNorm([1,2,3]) matches the expected values',
        code: `assertArrayClose(layerNorm([1, 2, 3]), [-1.2247, 0, 1.2247], 1e-3);`,
      },
      {
        name: 'addNorm adds the residual before normalizing',
        code: `assertArrayClose(addNorm([1, 2, 3], [0, 0, 0]), layerNorm([1, 2, 3]), 1e-9);
assertArrayClose(addNorm([1, 1, 1], [0, 1, 2]), layerNorm([1, 2, 3]), 1e-9);`,
      },
    ],
  },

  feedForward: {
    id: 'feedForward',
    title: 'Build the position-wise feed-forward block',
    prompt:
      'Implement Linear → ReLU → Linear. Each weight matrix is an array of rows; a row dotted with the input gives one output value.',
    repoRef: 'mini_transformer/model/encoder.py',
    starterCode: `function feedForward(x, w1, b1, w2, b2) {
  // 1. hidden[j] = dot(w1[j], x) + b1[j]
  // 2. ReLU: max(0, value)
  // 3. out[k]  = dot(w2[k], hidden) + b2[k]
  return [];
}`,
    solution: `function feedForward(x, w1, b1, w2, b2) {
  const dot = (row, vec) => row.reduce((sum, v, i) => sum + v * vec[i], 0);
  const hidden = w1.map((row, j) => Math.max(0, dot(row, x) + b1[j]));
  return w2.map((row, k) => dot(row, hidden) + b2[k]);
}`,
    hint: 'The hidden layer is wider than the input (d_ff > d_model), then the second matrix projects back down.',
    tests: [
      {
        name: 'expands, applies ReLU, and projects back',
        code: `const out = feedForward(
  [1, 2],
  [[1, 0], [0, 1], [1, 1]], [0, 0, -5],
  [[1, 0, 0], [0, 1, 0]], [0, 0],
);
assertArrayClose(out, [1, 2], 1e-9);`,
      },
      {
        name: 'ReLU actually clips negatives',
        code: `const out = feedForward(
  [1, 1],
  [[-1, -1]], [0],
  [[5]], [0],
);
assertArrayClose(out, [0], 1e-9, 'a negative pre-activation must be clipped to 0');`,
      },
      {
        name: 'biases are applied',
        code: `const out = feedForward([0], [[0]], [1], [[2]], [3]);
assertArrayClose(out, [5], 1e-9);`,
      },
    ],
  },

  maskedMeanPool: {
    id: 'maskedMeanPool',
    title: 'Pool the sequence into one vector',
    prompt:
      'The classifier head needs a single vector, not a sequence. Average the token vectors, counting only real tokens — padding must not drag the average around.',
    repoRef: 'mini_transformer/model/classifier.py',
    starterCode: `function maskedMeanPool(hidden, mask) {
  // hidden: array of token vectors; mask: 1 for a real token, 0 for padding
  // sum only the masked-in vectors, then divide by how many there were
  return [];
}`,
    solution: `function maskedMeanPool(hidden, mask) {
  const dim = hidden[0].length;
  const out = new Array(dim).fill(0);
  let count = 0;
  hidden.forEach((vec, t) => {
    if (!mask[t]) return;
    count += 1;
    vec.forEach((v, d) => { out[d] += v; });
  });
  return out.map((v) => v / Math.max(count, 1));
}`,
    hint: 'Divide by the number of real tokens, not by hidden.length — that is the whole point of the mask.',
    tests: [
      {
        name: 'averages every token when nothing is padded',
        code: `assertArrayClose(maskedMeanPool([[1, 1], [3, 3]], [1, 1]), [2, 2]);`,
      },
      {
        name: 'ignores padded positions entirely',
        code: `assertArrayClose(maskedMeanPool([[1, 1], [3, 3], [99, 99]], [1, 1, 0]), [2, 2]);`,
      },
      {
        name: 'divides by the real-token count, not the sequence length',
        code: `const out = maskedMeanPool([[4, 4], [0, 0], [0, 0]], [1, 0, 0]);
assertArrayClose(out, [4, 4], 1e-9, 'dividing by 3 instead of 1 would give [1.33, 1.33]');`,
      },
    ],
  },

  crossEntropy: {
    id: 'crossEntropy',
    title: 'Compute the classification loss',
    prompt:
      'Cross-entropy is the negative log probability the model assigned to the correct class. Confident and right → near 0; confident and wrong → large.',
    repoRef: 'train.py',
    starterCode: `// softmax() is available.

function crossEntropy(logits, targetIndex) {
  // 1. convert logits to probabilities
  // 2. return -Math.log(probability of the target class)
  return 0;
}`,
    solution: `function softmax(scores) {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function crossEntropy(logits, targetIndex) {
  return -Math.log(softmax(logits)[targetIndex]);
}`,
    hint: 'A 2-way coin flip (equal logits) has loss -log(0.5) ≈ 0.693. That is the "knows nothing" baseline.',
    tests: [
      {
        name: 'equal logits give -log(1/n)',
        code: `assertClose(crossEntropy([0, 0], 0), Math.log(2), 1e-6);
assertClose(crossEntropy([0, 0, 0, 0], 2), Math.log(4), 1e-6);`,
      },
      {
        name: 'confident and correct gives a near-zero loss',
        code: `assert(crossEntropy([10, 0, 0, 0], 0) < 0.001, 'expected a tiny loss');`,
      },
      {
        name: 'confident and wrong gives a large loss',
        code: `assert(crossEntropy([10, 0, 0, 0], 1) > 5, 'expected a large loss');`,
      },
      {
        name: 'loss falls as the target logit rises',
        code: `assert(crossEntropy([2, 0], 0) < crossEntropy([1, 0], 0), 'more confidence should mean less loss');`,
      },
    ],
  },

  encoderBlock: {
    id: 'encoderBlock',
    title: 'Capstone: wire a full encoder block',
    prompt:
      'Every piece you have built already exists below. Assemble one encoder layer: self-attention → Add&Norm → feed-forward → Add&Norm. This is the same order as EncoderLayer.forward in the repo.',
    repoRef: 'mini_transformer/model/encoder.py',
    starterCode: `// --- provided: everything you implemented in earlier lessons ---
function softmax(s){const m=Math.max(...s),e=s.map(v=>Math.exp(v-m)),t=e.reduce((a,b)=>a+b,0);return e.map(v=>v/t)}
function attentionRow(q,ks,vs){const dk=q.length,sc=ks.map(k=>k.reduce((s,kv,i)=>s+kv*q[i],0)/Math.sqrt(dk)),w=softmax(sc);return vs[0].map((_,d)=>w.reduce((s,wi,j)=>s+wi*vs[j][d],0))}
function layerNorm(v,eps=1e-5){const m=v.reduce((a,b)=>a+b,0)/v.length,va=v.reduce((a,b)=>a+(b-m)**2,0)/v.length,d=Math.sqrt(va+eps);return v.map(x=>(x-m)/d)}
function addNorm(x,s){return layerNorm(x.map((v,i)=>v+s[i]))}
function feedForward(x,w1,b1,w2,b2){const dot=(r,v)=>r.reduce((s,q,i)=>s+q*v[i],0);const h=w1.map((r,j)=>Math.max(0,dot(r,x)+b1[j]));return w2.map((r,k)=>dot(r,h)+b2[k])}

// --- your turn ---
function encoderBlock(x, sequence, ffn) {
  // x        : the vector for the token being updated
  // sequence : every token vector in the sequence (used as both keys and values)
  // ffn      : { w1, b1, w2, b2 } for the feed-forward sublayer
  //
  // 1. attnOut = self-attention with x as the query over the sequence
  // 2. afterAttn = Add & Norm of x with attnOut
  // 3. ffnOut = feedForward on afterAttn
  // 4. return Add & Norm of afterAttn with ffnOut
  return [];
}`,
    solution: `function softmax(s){const m=Math.max(...s),e=s.map(v=>Math.exp(v-m)),t=e.reduce((a,b)=>a+b,0);return e.map(v=>v/t)}
function attentionRow(q,ks,vs){const dk=q.length,sc=ks.map(k=>k.reduce((s,kv,i)=>s+kv*q[i],0)/Math.sqrt(dk)),w=softmax(sc);return vs[0].map((_,d)=>w.reduce((s,wi,j)=>s+wi*vs[j][d],0))}
function layerNorm(v,eps=1e-5){const m=v.reduce((a,b)=>a+b,0)/v.length,va=v.reduce((a,b)=>a+(b-m)**2,0)/v.length,d=Math.sqrt(va+eps);return v.map(x=>(x-m)/d)}
function addNorm(x,s){return layerNorm(x.map((v,i)=>v+s[i]))}
function feedForward(x,w1,b1,w2,b2){const dot=(r,v)=>r.reduce((s,q,i)=>s+q*v[i],0);const h=w1.map((r,j)=>Math.max(0,dot(r,x)+b1[j]));return w2.map((r,k)=>dot(r,h)+b2[k])}

function encoderBlock(x, sequence, ffn) {
  const attnOut = attentionRow(x, sequence, sequence);
  const afterAttn = addNorm(x, attnOut);
  const ffnOut = feedForward(afterAttn, ffn.w1, ffn.b1, ffn.w2, ffn.b2);
  return addNorm(afterAttn, ffnOut);
}`,
    hint: 'Four lines. Note that the second Add&Norm adds the residual from *after* the attention sublayer, not the original x.',
    tests: [
      {
        name: 'returns a vector of the input width',
        code: `const ffn = { w1: [[1,0],[0,1]], b1: [0,0], w2: [[1,0],[0,1]], b2: [0,0] };
const out = encoderBlock([1, 0], [[1, 0], [0, 1]], ffn);
assert(out.length === 2, 'output width should match the input width');`,
      },
      {
        name: 'output is layer-normalized (zero mean)',
        code: `const ffn = { w1: [[1,0],[0,1]], b1: [0,0], w2: [[1,0],[0,1]], b2: [0,0] };
const out = encoderBlock([2, -1], [[1, 0], [0, 1]], ffn);
assertClose(out.reduce((a,b)=>a+b,0) / out.length, 0, 1e-6);`,
      },
      {
        name: 'the second Add&Norm uses the post-attention residual, not the original x',
        code: `const ffn = {
  w1: [[1,0,0],[0,1,0],[0,0,1],[1,1,1]], b1: [0, 0, 0, 0],
  w2: [[1,0,0,0.5],[0,1,0,0],[0,0,1,0]], b2: [0.1, 0, 0],
};
const x = [2, 0, -1];
const seq = [[1, 2, 0], [0, 1, 3], [2, 0, 1]];
const out = encoderBlock(x, seq, ffn);

const attnOut = attentionRow(x, seq, seq);
const afterAttn = addNorm(x, attnOut);
const ffnOut = feedForward(afterAttn, ffn.w1, ffn.b1, ffn.w2, ffn.b2);

assertArrayClose(out, addNorm(afterAttn, ffnOut), 1e-6);
// Guard against the classic mistake of re-adding the original x here.
const wrong = addNorm(x, ffnOut);
assert(
  Math.abs(out[0] - wrong[0]) > 1e-3,
  'the second residual must come from after the attention sublayer',
);`,
      },
    ],
  },
}

export function getExercise(id: string): Exercise {
  const exercise = exercises[id]
  if (!exercise) throw new Error(`Unknown exercise: ${id}`)
  return exercise
}
