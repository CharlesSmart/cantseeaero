import React from 'react';
import { Profile } from '../types/Profile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

interface ProfileManagerProps {
  profiles: Profile[];
  onAddProfile: () => void;
  onSelectProfile: (id: string) => void;
  selectedProfileId: string | null;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onAddProfile, onSelectProfile, selectedProfileId }) => {
  return (
    <div>
      <ScrollArea>
      <Tabs value={selectedProfileId || ""} className='py-2'>
        <div className="w-full relative h-10">
        <TabsList className='max-w-sm overflow-x-auto flex absolute h-10'>
          {profiles.map(profile => (
            <TabsTrigger 
              value={profile.id} 
              onClick={() => onSelectProfile(profile.id)} 
            >
              {profile.id}
            </TabsTrigger>
          ))}
        </TabsList>
        </div>
        <ScrollBar orientation="horizontal" />
        
      </Tabs>
    </ScrollArea>
    </div>
  );
};


export default ProfileManager;
