import React from 'react';
import { Profile } from '../types/Profile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from './ui/scroll-area';

interface ProfileManagerProps {
  profiles: Profile[];
  onAddProfile: () => void;
  onSelectProfile: (id: string) => void;
  selectedProfileId: string | null;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onAddProfile, onSelectProfile, selectedProfileId }) => {
  return (
    <div>
      <Tabs value={selectedProfileId || ""} className='py-2'>
        <ScrollArea>
        <TabsList className='max-w-sm overflow-x-auto'>
          {profiles.map(profile => (
            <TabsTrigger 
              value={profile.id} 
              onClick={() => onSelectProfile(profile.id)} 
            >
              {profile.id}
            </TabsTrigger>
          ))}
        </TabsList>
        </ScrollArea>
      </Tabs>
    </div>
  );
};


export default ProfileManager;
