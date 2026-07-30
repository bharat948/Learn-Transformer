/**
 * Typed access to the JSON exported by `scripts/export_web_artifacts.py`.
 *
 * Everything here comes from the actual trained checkpoints in `outputs/` —
 * regenerate with `python scripts/export_web_artifacts.py` from the repo root.
 */
import attentionJson from './artifacts/attention.json'
import positionalJson from './artifacts/positional.json'
import ablationJson from './artifacts/ablation.json'
import baselinesJson from './artifacts/baselines.json'
import modelMetaJson from './artifacts/model_meta.json'

export interface AttentionSentence {
  text: string
  tokens: string[]
  unknownTokens: string[]
  /** [layer][head][queryIndex][keyIndex] */
  layers: number[][][][]
  predicted: string
  probabilities: Record<string, number>
}

export interface AttentionArtifact {
  numLayers: number
  numHeads: number
  classNames: string[]
  sentences: AttentionSentence[]
}

export interface PositionalArtifact {
  source: string
  maxLen: number
  dModel: number
  note: string
  /** [position][dimension] */
  table: number[][]
}

export interface EpochRecord {
  epoch: number
  train_loss: number
  train_acc: number
  val_loss: number
  val_acc: number
}

export interface AblationArtifact {
  results: Record<string, { test_acc: number; macro_f1: number; best_val_acc: number; num_params: number }>
  histories: Record<string, EpochRecord[] | null>
  confusionMatrices: Record<string, number[][] | null>
  classNames: string[]
}

export interface BaselineRecord {
  runName: string
  testAcc: number
  bestValAcc: number
  numParams: number
  trainTimeSec: number
  macroF1: number | null
  history: EpochRecord[] | null
}

export interface ModelMeta {
  config: {
    model: string
    pos_encoding: string
    d_model: number
    num_heads: number
    d_ff: number
    num_layers: number
    dropout: number
    max_len: number
  }
  classNames: string[]
  vocabSize: number
  numParams: number
  testAcc: number
  sourceCheckpoint: string
}

export const attention = attentionJson as unknown as AttentionArtifact
export const positional = positionalJson as unknown as PositionalArtifact
export const ablation = ablationJson as unknown as AblationArtifact
export const baselines = baselinesJson as unknown as Record<string, BaselineRecord>
export const modelMeta = modelMetaJson as unknown as ModelMeta
