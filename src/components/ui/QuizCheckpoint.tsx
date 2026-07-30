import { useState } from 'react'

interface QuizCheckpointProps {
  question: string
  answer: string
  index?: number
}

export default function QuizCheckpoint({ question, answer, index }: QuizCheckpointProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="not-prose my-8 border-l-2 border-rule-strong pl-5">
      <p className="label mb-2">Checkpoint{typeof index === 'number' ? ` ${index}` : ''}</p>
      <p className="font-serif text-prose-sm text-ink">{question}</p>

      {revealed ? (
        <p className="mt-3 font-serif text-prose-sm text-ink-muted">{answer}</p>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 font-sans text-[0.8125rem] font-medium text-accent underline decoration-accent-soft decoration-2 underline-offset-4 transition hover:decoration-accent"
        >
          Reveal answer
        </button>
      )}
    </div>
  )
}
