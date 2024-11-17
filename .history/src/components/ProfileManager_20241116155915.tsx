import React from 'react';
import { Profile } from '../types/Profile';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/verticaltabs';
import { toWords } from 'number-to-words';
import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileManagerProps {
  profiles: Profile[];
  onSelectProfile: (id: number) => void;
  selectedProfileId: number | null;
  onDeleteProfile: (id: number) => void;
  onImageUpload: (file: File | null) => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onSelectProfile, selectedProfileId, onDeleteProfile, onImageUpload }) => {
  
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
              <div className="h-8 w-8 rounded-sm bg-secondary">
                {profile.imageUrl && <img src={profile.imageUrl || ''} alt={`Profile preview`} className="object-cover" />}
              </div> 
              {capitalize(toWords(profile.id))}
              {profile.pixelCounts &&
              <div className='grid grid-cols-3'>
                <span>{Math.round(profile.pixelCounts?.opaquePercentage ?? 0)}%</span>
                <span>{Math.round(profile.pixelCounts?.transparentPercentage ?? 0)}%</span>
                <span>{Math.round(profile.pixelCounts?.semiTransparentPercentage ?? 0)}%</span>
              </div>
              }
              <Button onClick={() => onDeleteProfile(profile.id)} variant="ghost" className='justify-self-end gap-2 -mr-2 px-2'><Trash className='w-4 h-4 text-muted-foreground'/></Button>
            </TabsTrigger>
          ))}
        </TabsList>
        </div>
        
      </Tabs>
    </div>
  );
};


export default ProfileManager;
