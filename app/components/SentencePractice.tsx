'use client';

import { useEffect, useState } from 'react';

type SentencePracticeProps = {
  learnedWords: number[];
};

export default function SentencePractice({ learnedWords }: SentencePracticeProps) {
  const [sentence, setSentence] = useState('');
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateSentence = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-sentence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ learnedWords }),
      });

      const data = await response.json();
      setSentence(data.sentence || '');
      setTranslation(data.translation || '');
    } catch (error) {
      console.error('Failed to fetch sentence:', error);
      setSentence('我在练习汉字，今天也要继续学习。');
      setTranslation('I am practicing Chinese characters and continuing to learn today.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (learnedWords.length >= 20) {
      generateSentence();
    }
  }, [learnedWords]);

  return (
    <div className="sentenceCard">
      <p className="sentenceLabel">Sentence practice</p>
      <div className="sentenceText">{isLoading ? 'Loading sentence...' : sentence}</div>
      <div className="translationText">{translation}</div>
      <button type="button" className="primaryButton" onClick={generateSentence} disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Get new sentence'}
      </button>
    </div>
  );
}
