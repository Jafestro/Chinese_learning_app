import { NextResponse } from 'next/server';

const mockSentences = [
  {
    sentence: '我在学习中文，我会说更多的句子。',
    translation: 'I am learning Chinese and I will say more sentences.',
  },
  {
    sentence: '今天的汉字很有意思，我想继续练习。',
    translation: 'Today’s Chinese characters are interesting, and I want to continue practicing.',
  },
  {
    sentence: '我们一起看书，学习新的词语和句子。',
    translation: 'We read together and learn new words and sentences.',
  },
  {
    sentence: '我认识了很多字，也学会了新的表达。',
    translation: 'I have learned many characters and new ways to express myself.',
  },
];

export async function POST(request: Request) {
  let learnedWords: number[] = [];

  try {
    const body = await request.json();
    learnedWords = Array.isArray(body.learnedWords) ? body.learnedWords : [];
  } catch {
    learnedWords = [];
  }

  const sentenceTemplate = mockSentences[Math.floor(Math.random() * mockSentences.length)];

  return NextResponse.json({
    sentence: sentenceTemplate.sentence,
    translation: sentenceTemplate.translation,
    learnedWords,
  });
}
