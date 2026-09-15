'use client';

import { useEffect, useMemo, useState } from 'react';
import Flashcard from './components/Flashcard';
import ProgressBar from './components/ProgressBar';
import SentencePractice from './components/SentencePractice';

type Word = {
  id: number;
  character: string;
  pinyin: string;
  english: string;
};

const STORAGE_KEY = 'learnedWords';

export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [learnedWords, setLearnedWords] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setLearnedWords(parsed.filter((value): value is number => Number.isInteger(value)));
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    fetch('/top_2500_characters.json')
      .then((response) => response.json())
      .then((data: Word[]) => setWords(data))
      .catch(() => setWords([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(learnedWords));
  }, [learnedWords]);

  const unlearnedWords = useMemo(
    () => words.filter((word) => !learnedWords.includes(word.id)),
    [words, learnedWords],
  );

  useEffect(() => {
    if (unlearnedWords.length === 0) {
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex((previous) => Math.min(previous, unlearnedWords.length - 1));
  }, [unlearnedWords.length]);

  const currentWord = unlearnedWords[currentIndex] ?? null;

  const handleMarkLearned = () => {
    if (!currentWord) {
      return;
    }

    setLearnedWords((previous) => {
      if (previous.includes(currentWord.id)) {
        return previous;
      }
      return [...previous, currentWord.id];
    });

    setCurrentIndex((previous) => Math.min(previous, Math.max(unlearnedWords.length - 2, 0)));
  };

  const shouldShowSentencePractice = learnedWords.length >= 20;

  return (
    <main className="pageShell">
      <section className="appCard">
        <header className="topBar">
          <div>
            <p className="eyebrow">Chinese Character Journey</p>
            <h1>Daily Study</h1>
          </div>
          <ProgressBar current={learnedWords.length} total={words.length || 2500} />
        </header>

        {isLoading ? (
          <div className="loadingState">Loading vocabulary...</div>
        ) : shouldShowSentencePractice ? (
          <SentencePractice learnedWords={learnedWords} />
        ) : currentWord ? (
          <Flashcard
            word={currentWord}
            currentIndex={currentIndex}
            total={unlearnedWords.length || 1}
            onMarkLearned={handleMarkLearned}
          />
        ) : (
          <div className="loadingState">All words mastered — check back later.</div>
        )}
      </section>
    </main>
  );
}
