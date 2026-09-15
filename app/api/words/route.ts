import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'top_2500_characters.json');

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const words = JSON.parse(fileContents);
    return NextResponse.json(words);
  } catch (error) {
    console.error('Failed to load vocabulary data:', error);
    return NextResponse.json(
      { error: 'Unable to load vocabulary data.' },
      { status: 500 },
    );
  }
}
