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
const THEME_STORAGE_KEY = 'chinese-learning-theme';
const SENTENCE_UNLOCK_COUNT = 20;

type StudyMode = 'words' | 'sentences';

export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [learnedWords, setLearnedWords] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<StudyMode>('words');
  const [isNightMode, setIsNightMode] = useState(false);

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

    if (localStorage.getItem(THEME_STORAGE_KEY) === 'night') {
      setIsNightMode(true);
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

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, isNightMode ? 'night' : 'day');
  }, [isNightMode]);

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

  const canPracticeSentences = learnedWords.length >= SENTENCE_UNLOCK_COUNT;

  return (
    <main className={`pageShell${isNightMode ? ' nightMode' : ''}`}>
      <section className="appCard">
        <header className="topBar">
          <div className="brandBlock">
            <p className="eyebrow">Chinese Character Journey</p>
            <h1>Daily Study</h1>
            <p className="headerDescription">
              Build your foundation one character at a time, then use it in context.
            </p>
          </div>
          <button
            type="button"
            className="themeToggle"
            onClick={() => setIsNightMode((previous) => !previous)}
            aria-pressed={isNightMode}
            aria-label={`Switch to ${isNightMode ? 'day' : 'night'} mode`}
          >
            <span className="themeIcon" aria-hidden="true">
              {isNightMode ? '☀' : '◐'}
            </span>
            <span>{isNightMode ? 'Day mode' : 'Night mode'}</span>
          </button>
        </header>

        <div className="menuHeading">
          <div>
            <p className="sectionKicker">Study menu</p>
            <h2>Choose a practice mode</h2>
          </div>
          <span className="learnedSummary">{learnedWords.length} characters learned</span>
        </div>

        <nav className="studyMenu" aria-label="Study modes">
          <button
            type="button"
            className={`menuOption ${activeMode === 'words' ? 'selected' : ''}`}
            onClick={() => setActiveMode('words')}
            aria-pressed={activeMode === 'words'}
          >
            <span className="menuMark" aria-hidden="true">字</span>
            <span className="menuCopy">
              <strong>Word Learning</strong>
              <small>Learn new characters with flashcards</small>
            </span>
            <span className="menuBadge">Always available</span>
            <span className="menuArrow" aria-hidden="true">→</span>
          </button>

          <button
            type="button"
            className={`menuOption ${activeMode === 'sentences' ? 'selected' : ''}`}
            onClick={() => setActiveMode('sentences')}
            disabled={!canPracticeSentences}
            aria-pressed={activeMode === 'sentences'}
          >
            <span className="menuMark" aria-hidden="true">句</span>
            <span className="menuCopy">
              <strong>Sentence Practice</strong>
              <small>
                {canPracticeSentences
                  ? 'Use your learned characters in context'
                  : `Unlock at ${SENTENCE_UNLOCK_COUNT} learned characters`}
              </small>
            </span>
            <span className="menuBadge">
              {canPracticeSentences
                ? 'Ready to practice'
                : `${Math.max(SENTENCE_UNLOCK_COUNT - learnedWords.length, 0)} to unlock`}
            </span>
            <span className="menuArrow" aria-hidden="true">
              {canPracticeSentences ? '→' : 'Locked'}
            </span>
          </button>
        </nav>

        <ProgressBar current={learnedWords.length} total={words.length || 2500} />

        {isLoading ? (
          <div className="loadingState">Loading vocabulary...</div>
        ) : activeMode === 'sentences' && canPracticeSentences ? (
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
