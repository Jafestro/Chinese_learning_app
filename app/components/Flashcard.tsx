'use client';

import { useEffect, useState } from 'react';

type Word = {
  id: number;
  character: string;
  pinyin: string;
  english: string;
  learned?: boolean;
};

type FlashcardProps = {
  word: Word | null;
  currentIndex: number;
  total: number;
  onMarkLearned: () => void;
};

export default function Flashcard({
  word,
  currentIndex,
  total,
  onMarkLearned,
}: FlashcardProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [word?.id]);

  if (!word) {
    return null;
  }

  return (
    <div className="flashcard">
      <div className="cardMeta">
        <span>
          Word {currentIndex + 1} / {total}
        </span>
        <span>ID {word.id}</span>
      </div>

      <div className="characterStage">
        <div className="characterDisplay">{word.character}</div>
      </div>

      {revealed ? (
        <div className="revealBlock">
          <p className="pinyin">{word.pinyin}</p>
          <p className="english">{word.english}</p>
        </div>
      ) : null}

      <div className="buttonRow">
        <button type="button" className="secondaryButton" onClick={() => setRevealed((prev) => !prev)}>
          {revealed ? 'Hide' : 'Reveal'}
        </button>
        <button type="button" className="primaryButton" onClick={onMarkLearned}>
          Mark as Learned
        </button>
      </div>
    </div>
  );
}
