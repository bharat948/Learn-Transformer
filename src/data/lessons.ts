import type { ComponentType } from 'react'

import RnnLstmRecap from '../lessons/00-rnn-lstm-recap/index.mdx'
import WhyTransformersExist from '../lessons/01-why-transformers-exist/index.mdx'
import AttentionIntuition from '../lessons/02-attention-intuition/index.mdx'
import PositionalEncoding from '../lessons/03-positional-encoding/index.mdx'
import MultiHeadAttention from '../lessons/04-multi-head-attention/index.mdx'
import EncoderBlock from '../lessons/05-encoder-block/index.mdx'
import SequenceToPrediction from '../lessons/06-sequence-to-prediction/index.mdx'
import TrainingLoop from '../lessons/07-training-loop/index.mdx'
import AblationAndComparison from '../lessons/08-ablation-and-comparison/index.mdx'
import Capstone from '../lessons/09-capstone/index.mdx'

/**
 * Theory   — read and understand
 * Lab      — drive an interactive visualization
 * Code     — write code that must pass tests
 * Capstone — assemble everything against the real repo
 */
export type LessonKind = 'theory' | 'lab' | 'code' | 'capstone'

export interface Milestone {
  id: string
  title: string
  /** Auto-ticked by a CodeSandbox rather than a manual button. */
  auto?: boolean
}

export interface Lesson {
  id: string
  slug: string
  order: number
  title: string
  summary: string
  kind: LessonKind
  /** What the learner should be able to do afterwards. */
  objective: string
  milestones: Milestone[]
  Component: ComponentType
}

export const KIND_LABEL: Record<LessonKind, string> = {
  theory: 'Theory',
  lab: 'Lab',
  code: 'Code',
  capstone: 'Capstone',
}

export const KIND_CLASS: Record<LessonKind, string> = {
  theory: 'bg-slate-100 text-slate-600',
  lab: 'bg-sky-100 text-sky-700',
  code: 'bg-accent/10 text-accent',
  capstone: 'bg-accent2/10 text-accent2',
}

export const lessons: Lesson[] = [
  {
    id: 'rnn-lstm-recap',
    slug: 'rnn-lstm-recap',
    order: 0,
    title: 'RNN & LSTM Recap',
    summary:
      'How sequence modeling worked before attention, and exactly which limitations Transformers were built to remove.',
    kind: 'theory',
    objective:
      'By the end, you can explain why RNN computation cannot be parallelized across timesteps, why long-range dependencies are difficult to preserve, and how LSTMs mitigate—but do not eliminate—this problem.',
    milestones: [
      { id: 'sequential', title: 'Explain why an RNN cannot parallelize over time' },
      { id: 'gating', title: 'Describe what the LSTM cell state adds' },
    ],
    Component: RnnLstmRecap,
  },
  {
    id: 'why-transformers-exist',
    slug: 'why-transformers-exist',
    order: 1,
    title: 'Why Transformers Exist',
    summary:
      'The parallelization and long-range-dependency bottlenecks that motivated "Attention Is All You Need".',
    kind: 'theory',
    objective:
      'Articulate the two structural problems self-attention solved, and what constant path length buys you.',
    milestones: [{ id: 'path-length', title: 'Compare RNN vs. attention path length' }],
    Component: WhyTransformersExist,
  },
  {
    id: 'attention-intuition',
    slug: 'attention-intuition',
    order: 2,
    title: 'Attention Intuition',
    summary: 'Query, key, value, and the scaled dot-product attention formula, from first principles.',
    kind: 'code',
    objective:
      'Implement scaled dot-product attention and explain what each of Q, K, and V contributes.',
    milestones: [
      { id: 'softmax', title: 'Implement softmax', auto: true },
      { id: 'attention-row', title: 'Compute one attention row', auto: true },
    ],
    Component: AttentionIntuition,
  },
  {
    id: 'positional-encoding',
    slug: 'positional-encoding',
    order: 3,
    title: 'Positional Encoding',
    summary: 'Why self-attention needs help knowing word order, and how sinusoidal vs. learned encodings compare.',
    kind: 'code',
    objective:
      'Build a sinusoidal position vector and explain why self-attention alone is permutation-equivariant.',
    milestones: [
      { id: 'build-pe', title: 'Build a sinusoidal position vector', auto: true },
      { id: 'permutation', title: 'Demonstrate the permutation problem' },
    ],
    Component: PositionalEncoding,
  },
  {
    id: 'multi-head-attention',
    slug: 'multi-head-attention',
    order: 4,
    title: 'Multi-Head Attention',
    summary:
      'Why several attention heads beat one, shown with the real 4-head weights from this repo’s trained model.',
    kind: 'code',
    objective:
      'Split a representation into heads and read real per-head attention patterns off a trained checkpoint.',
    milestones: [
      { id: 'split', title: 'Split a vector into heads', auto: true },
      { id: 'compare-heads', title: 'Find two heads that disagree' },
    ],
    Component: MultiHeadAttention,
  },
  {
    id: 'encoder-block',
    slug: 'encoder-block',
    order: 5,
    title: 'The Encoder Block',
    summary: 'Residual connections, layer normalization, and the position-wise feed-forward network.',
    kind: 'code',
    objective:
      'Implement Add & Norm and the FFN, and explain which sublayer mixes information across tokens.',
    milestones: [
      { id: 'addnorm', title: 'Implement Add & Norm', auto: true },
      { id: 'ffn', title: 'Build the feed-forward block', auto: true },
    ],
    Component: EncoderBlock,
  },
  {
    id: 'sequence-to-prediction',
    slug: 'sequence-to-prediction',
    order: 6,
    title: 'From Sequence to Prediction',
    summary: 'Masked pooling, the classification head, and why padding quietly corrupts naive averages.',
    kind: 'code',
    objective:
      'Pool a padded sequence correctly and explain the difference between logits and probabilities.',
    milestones: [{ id: 'pool', title: 'Pool a sequence without padding corruption', auto: true }],
    Component: SequenceToPrediction,
  },
  {
    id: 'training-loop',
    slug: 'training-loop',
    order: 7,
    title: 'Training the Model',
    summary: 'Loss, backpropagation, AdamW, and reading a real training curve for overfitting.',
    kind: 'code',
    objective:
      'Implement cross-entropy loss and diagnose overfitting from the train/validation gap.',
    milestones: [
      { id: 'loss', title: 'Implement cross-entropy loss', auto: true },
      { id: 'read-curve', title: 'Diagnose the training run' },
    ],
    Component: TrainingLoop,
  },
  {
    id: 'ablation-and-comparison',
    slug: 'ablation-and-comparison',
    order: 8,
    title: 'Ablation & Model Comparison',
    summary:
      'Real baseline and ablation results — including the uncomfortable finding that positional encoding barely helps here.',
    kind: 'lab',
    objective:
      'Design a fair comparison and interpret a result that does not flatter your architecture.',
    milestones: [
      { id: 'interpret', title: 'Interpret an unflattering result' },
      { id: 'confusion', title: 'Find the model’s weakest class' },
    ],
    Component: AblationAndComparison,
  },
  {
    id: 'capstone',
    slug: 'capstone',
    order: 9,
    title: 'Capstone: Build & Compare',
    summary: 'Assemble a full encoder block, map every concept to the Python repo, and run it yourself.',
    kind: 'capstone',
    objective:
      'Assemble a complete encoder block and trace a headline end to end through the real implementation.',
    milestones: [
      { id: 'build', title: 'Build a complete encoder block', auto: true },
      { id: 'trace', title: 'Trace a headline end to end' },
      { id: 'modify', title: 'Change something and measure it' },
    ],
    Component: Capstone,
  },
]

export function getLessonBySlug(slug: string | undefined): Lesson | undefined {
  return lessons.find((lesson) => lesson.slug === slug)
}

export function getAdjacentLessons(order: number): { prev?: Lesson; next?: Lesson } {
  return {
    prev: lessons.find((l) => l.order === order - 1),
    next: lessons.find((l) => l.order === order + 1),
  }
}

export const totalMilestones = lessons.reduce((sum, l) => sum + l.milestones.length, 0)
