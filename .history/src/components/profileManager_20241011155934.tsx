import React from 'react';
import { Profile } from '../types/Profile';

interface ProfileManagerProps {
  profiles: Profile[];
  onAddProfile: () => void;
  onSelectProfile: (id: string) => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onAddProfile, onSelectProfile }) => {
    console.log('profile manager');

  return (
    <div>
      <button onClick={onAddProfile}>Add Profile</button>
      <ul>
        {profiles.map(profile => (
          <li key={profile.id} onClick={() => onSelectProfile(profile.id)}>
            Profile {profile.id}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProfileManager;
