import React from 'react';
import { Profile } from '../types/Profile';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProfileManagerProps {
  profiles: Profile[];
  onAddProfile: () => void;
  onSelectProfile: (id: string) => void;
  selectedProfileId: string | null;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onAddProfile, onSelectProfile, selectedProfileId }) => {
  return (
    <div>
      {/* <Button variant='outline' onClick={onAddProfile}>Add Profile</Button> */}
      <Tabs>
        <TabsList>
          {profiles.map(profile => (
            <TabsTrigger 
              // variant='ghost' 
              value={profile.id} 
              onClick={() => onSelectProfile(profile.id)} 
              // className={`${profile.id === selectedProfileId ? 'bg-slate-100' : ''} justify-normal`}
            >
              {profile.id}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
      // <ul className='grid -mx-4'>
      //   {profiles.map(profile => (
      //     <Button 
      //       variant='ghost' 
      //       key={profile.id} 
      //       onClick={() => onSelectProfile(profile.id)} 
      //       className={`${profile.id === selectedProfileId ? 'bg-slate-100' : ''} justify-normal`}
      //     >
      //       {profile.id}
      //     </Button>
      //   ))}
      // </ul>
    
  // );
  // </div>
// };

export default ProfileManager;
