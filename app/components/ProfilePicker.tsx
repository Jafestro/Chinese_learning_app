'use client';

import { FormEvent, useState } from 'react';

export type Profile = {
  id: string;
  name: string;
  learnedWordIds: number[];
  createdAt: string;
  updatedAt: string;
};

type ProfilePickerProps = {
  profiles: Profile[];
  isLoading: boolean;
  onProfileSelected: (profile: Profile) => void;
  onProfileCreated: (profile: Profile) => void;
  onProfileDeleted: (profileId: string) => void;
};

export default function ProfilePicker({
  profiles,
  isLoading,
  onProfileSelected,
  onProfileCreated,
  onProfileDeleted,
}: ProfilePickerProps) {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState('');
  const [error, setError] = useState('');

  const createProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = (await response.json()) as Profile & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create profile.');
      }

      setName('');
      onProfileCreated(data);
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : 'Unable to create profile.');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteProfile = async (profile: Profile) => {
    if (!window.confirm(`Delete ${profile.name}'s profile and all learning progress?`)) {
      return;
    }

    setError('');
    setDeletingProfileId(profile.id);

    try {
      const response = await fetch('/api/profiles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profile.id }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete profile.');
      }

      onProfileDeleted(profile.id);
    } catch (deletionError) {
      setError(deletionError instanceof Error ? deletionError.message : 'Unable to delete profile.');
    } finally {
      setDeletingProfileId('');
    }
  };

  if (isLoading) {
    return <div className="profileLoading">Loading profiles...</div>;
  }

  return (
    <section className="profilePanel" aria-labelledby="profile-title">
      <div className="profileIntro">
        <p className="sectionKicker">Your learning space</p>
        <h2 id="profile-title">Who is learning today?</h2>
        <p>Choose a profile to pick up where you left off, or start a fresh journey.</p>
      </div>

      {profiles.length > 0 ? (
        <div className="profileList" aria-label="Saved profiles">
          {profiles.map((profile) => (
            <div className="profileOption" key={profile.id}>
              <button type="button" className="profileSelect" onClick={() => onProfileSelected(profile)}>
                <span className="profileAvatar" aria-hidden="true">{profile.name.slice(0, 1).toUpperCase()}</span>
                <span className="profileDetails">
                  <strong>{profile.name}</strong>
                  <small>{profile.learnedWordIds.length} characters learned</small>
                </span>
              </button>
              <button
                type="button"
                className="deleteProfileButton"
                onClick={() => deleteProfile(profile)}
                disabled={deletingProfileId === profile.id}
                aria-label={`Delete ${profile.name} profile`}
                title="Delete profile"
              >
                {deletingProfileId === profile.id ? '...' : '×'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="emptyProfiles">No profiles yet. Create the first one to begin.</div>
      )}

      <div className="profileDivider"><span>or create a new profile</span></div>

      <form className="profileForm" onSubmit={createProfile}>
        <label htmlFor="profile-name">Profile name</label>
        <div className="profileFormRow">
          <input
            id="profile-name"
            name="profileName"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Maya"
            maxLength={60}
            autoComplete="name"
            required
          />
          <button type="submit" className="primaryButton" disabled={isCreating || !name.trim()}>
            {isCreating ? 'Creating...' : 'Create profile'}
          </button>
        </div>
        {error ? <p className="profileError" role="alert">{error}</p> : null}
      </form>
    </section>
  );
}