import React from 'react';
import { Profile } from '../types/Profile';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { toWords } from 'number-to-words';

interface ProfileManagerProps {
  profiles: Profile[];
  onSelectProfile: (id: number) => void;
  selectedProfileId: number | null;
  onDeleteProfile: (id: number) => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onSelectProfile, selectedProfileId, onDeleteProfile }) => {
  
  const selectedProfileIdString = selectedProfileId ? toWords(selectedProfileId) : "";
  const capitalize = (s: string) => (s && s[0].toUpperCase() + s.slice(1)) || ""

  return (
    <div>
      <Tabs value={selectedProfileIdString || ""} className='pb-2'>
        <div className="w-full relative">
        <TabsList>
          {profiles.map(profile => (
            <TabsTrigger 
              key={profile.id}
              value={toWords(profile.id)} 
              onClick={() => onSelectProfile(profile.id)} 
            >
              {capitalize(toWords(profile.id))}
            </TabsTrigger>
          ))}
        </TabsList>
        </div>
        
      </Tabs>
    </div>
  );
};


export default ProfileManager;
