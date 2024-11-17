import React from 'react';
import { Profile } from '../types/Profile';
import { Button } from '@/components/ui/button';

interface ProfileManagerProps {
  profiles: Profile[];
  onAddProfile: () => void;
  onSelectProfile: (id: string) => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onAddProfile, onSelectProfile }) => {
  return (
    <div>
      <button onClick={onAddProfile}>Add Profile</button>
      <ul>
        {profiles.map(profile => (
          <button key={profile.id} onClick={() => onSelectProfile(profile.id)}>
            Profile {profile.id}
          </button>
        ))}
      </ul>
    </div>
  );
};

export default ProfileManager;
