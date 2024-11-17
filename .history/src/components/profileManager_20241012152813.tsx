import React from 'react';
import { Profile } from '../types/Profile';
import { Button } from '@/components/ui/button';

interface ProfileManagerProps {
  profiles: Profile[];
  onAddProfile: () => void;
  onSelectProfile: (id: string) => void;
  selectedProfileId: string | null;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onAddProfile, onSelectProfile, selectedProfileId }) => {
  return (
    <div>
      <Button onClick={onAddProfile}>Add Profile</Button>
      <ul>
        {profiles.map(profile => (
          <Button 
            variant='ghost' 
            key={profile.id} 
            onClick={() => onSelectProfile(profile.id)} 
            className={profile.id === selectedProfileId ? 'bg-slate-100' : ''}
          >
            Profile {profile.id}
          </Button>
        ))}
      </ul>
    </div>
  );
};

export default ProfileManager;
