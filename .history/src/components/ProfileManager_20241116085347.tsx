import React from 'react';
import { Profile } from '../types/Profile';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toWords } from 'number-to-words';
import { DataRow } from './ui/datarow';

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
              <img src={profile.imageUrl || ''} alt={`Profile preview`} className="h-10 w-10 rounded-sm object-cover bg-secondary" />
              {capitalize(toWords(profile.id))}
              <DataRow label={'Opaque'} value={profile.pixelCounts?.opaquePercentage ?? ' '}/>
              <DataRow label={'Transparent'} value={profile.pixelCounts?.transparentPercentage ?? ' '}/>
              <DataRow label={'Semi-transparent'} value={profile.pixelCounts?.semiTransparentPercentage ?? ' '}/>
            </TabsTrigger>
          ))}
        </TabsList>
        </div>
        
      </Tabs>
    </div>
  );
};


export default ProfileManager;
