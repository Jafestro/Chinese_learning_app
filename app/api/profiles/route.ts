import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

type StoredProfile = {
  name: string;
  learnedWordIds: number[];
  createdAt: string;
  updatedAt: string;
};

const profilesDirectory = path.join(process.cwd(), 'profiles');

function profileFolderName(name: string) {
  return name
    .trim()
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 80);
}

async function readProfiles() {
  try {
    const entries = await fs.readdir(profilesDirectory, { withFileTypes: true });
    const profiles = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          try {
            const filePath = path.join(profilesDirectory, entry.name, 'profile.json');
            const contents = await fs.readFile(filePath, 'utf8');
            const profile = JSON.parse(contents) as StoredProfile;
            return { id: entry.name, ...profile };
          } catch {
            return null;
          }
        }),
    );

    return profiles.filter((profile): profile is StoredProfile & { id: string } => profile !== null);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function GET() {
  try {
    return NextResponse.json(await readProfiles());
  } catch (error) {
    console.error('Failed to load profiles:', error);
    return NextResponse.json({ error: 'Unable to load profiles.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: unknown };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const id = profileFolderName(name);

    if (!name || !id || name.length > 60) {
      return NextResponse.json(
        { error: 'Choose a profile name between 1 and 60 characters.' },
        { status: 400 },
      );
    }

    await fs.mkdir(profilesDirectory, { recursive: true });
    const profileDirectory = path.join(profilesDirectory, id);
    const profilePath = path.join(profileDirectory, 'profile.json');

    try {
      await fs.access(profilePath);
      return NextResponse.json({ error: 'A profile with that name already exists.' }, { status: 409 });
    } catch {
      // The profile is new.
    }

    const now = new Date().toISOString();
    const profile: StoredProfile = {
      name,
      learnedWordIds: [],
      createdAt: now,
      updatedAt: now,
    };

    await fs.mkdir(profileDirectory, { recursive: true });
    await fs.writeFile(profilePath, JSON.stringify(profile, null, 2) + '\n', 'utf8');

    return NextResponse.json({ id, ...profile }, { status: 201 });
  } catch (error) {
    console.error('Failed to create profile:', error);
    return NextResponse.json({ error: 'Unable to create profile.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: unknown; learnedWordIds?: unknown };
    const id = typeof body.id === 'string' ? profileFolderName(body.id) : '';
    const learnedWordIds = Array.isArray(body.learnedWordIds)
      ? [...new Set(body.learnedWordIds.filter((value): value is number => Number.isInteger(value) && value > 0))]
      : null;

    if (!id || !learnedWordIds) {
      return NextResponse.json({ error: 'Invalid profile progress.' }, { status: 400 });
    }

    const profilePath = path.join(profilesDirectory, id, 'profile.json');
    const profile = JSON.parse(await fs.readFile(profilePath, 'utf8')) as StoredProfile;
    const updatedProfile = { ...profile, learnedWordIds, updatedAt: new Date().toISOString() };
    await fs.writeFile(profilePath, JSON.stringify(updatedProfile, null, 2) + '\n', 'utf8');

    return NextResponse.json({ id, ...updatedProfile });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Unable to update profile.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { id?: unknown };
    const id = typeof body.id === 'string' ? profileFolderName(body.id) : '';

    if (!id) {
      return NextResponse.json({ error: 'Invalid profile.' }, { status: 400 });
    }

    await fs.rm(path.join(profilesDirectory, id), { recursive: true, force: true });
    return NextResponse.json({ id });
  } catch (error) {
    console.error('Failed to delete profile:', error);
    return NextResponse.json({ error: 'Unable to delete profile.' }, { status: 500 });
  }
}