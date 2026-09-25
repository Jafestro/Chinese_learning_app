'use client';

import { useEffect, useState } from 'react';

type Word = {
  id: number;
  character: string;
  pinyin: string;
  english: string;
};

type WordPracticeProps = {
  words: Word[];
};

type PracticeRating = 'again' | 'got-it' | 'easy';

export default function WordPractice({ words }: WordPracticeProps) {
  const [queue, setQueue] = useState<number[]>(() => words.map((word) => word.id));
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [ratings, setRatings] = useState<Record<number, PracticeRating>>({});
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setQueue(words.map((word) => word.id));
    setCompletedIds(new Set());
    setRatings({});
    setRevealed(false);
  }, [words]);

  const currentWord = words.find((word) => word.id === queue[0]);
  const isComplete = queue.length === 0;

  const rateCurrentWord = (rating: PracticeRating) => {
    if (!currentWord) {
      return;
    }

    const nextQueue = queue.slice(1);
    setRatings((previous) => ({ ...previous, [currentWord.id]: rating }));

    if (rating === 'again') {
      setQueue([...nextQueue, currentWord.id]);
    } else {
      setQueue(nextQueue);
      setCompletedIds((previous) => new Set(previous).add(currentWord.id));
    }

    setRevealed(false);
  };

  const restartPractice = () => {
    setQueue(words.map((word) => word.id));
    setCompletedIds(new Set());
    setRatings({});
    setRevealed(false);
  };

  if (words.length === 0) {
    return <div className="loadingState">Learn a word first to start practicing.</div>;
  }

  if (isComplete) {
    return (
      <section className="practiceCard" aria-labelledby="practice-complete-title">
        <div className="practiceComplete">
          <span className="practiceCompleteMark" aria-hidden="true">✓</span>
          <p className="practiceLabel">Practice complete</p>
          <h2 id="practice-complete-title">You reviewed {completedIds.size} learned words.</h2>
          <p className="practiceMessage">Your next review will feel easier because you came back to these words.</p>
          <button type="button" className="primaryButton" onClick={restartPractice}>
            Practice again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="practiceCard" aria-labelledby="practice-title">
      <div className="cardMeta">
        <span>{completedIds.size} of {words.length} completed</span>
        <span>ID {currentWord?.id}</span>
      </div>

      <div className="practiceIntro">
        <p className="practiceLabel">Word practice</p>
        <h2 id="practice-title">Can you remember this word?</h2>
        <p>Say the pronunciation and meaning before revealing the answer.</p>
      </div>

      <div className="characterStage">
        <div className="characterDisplay">{currentWord?.character}</div>
      </div>

      {revealed ? (
        <div className="revealBlock">
          <p className="pinyin">{currentWord?.pinyin}</p>
          <p className="english">{currentWord?.english}</p>
        </div>
      ) : (
        <p className="practiceHint">Answer out loud, then reveal the pronunciation and meaning.</p>
      )}

      <div className="buttonRow">
        {!revealed ? (
          <button type="button" className="primaryButton" onClick={() => setRevealed(true)}>
            Reveal answer
          </button>
        ) : (
          <>
            <button type="button" className="practiceRating needsPractice" onClick={() => rateCurrentWord('again')}>
              Needs more practice
            </button>
            <button type="button" className="practiceRating gotIt" onClick={() => rateCurrentWord('got-it')}>
              Got it
            </button>
            <button type="button" className="practiceRating easy" onClick={() => rateCurrentWord('easy')}>
              Easy
            </button>
          </>
        )}
      </div>
    </section>
  );
}