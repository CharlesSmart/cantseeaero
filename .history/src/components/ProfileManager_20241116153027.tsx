import React from 'react';
import { Profile } from '../types/Profile';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/verticaltabs';
import { toWords } from 'number-to-words';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Ellipsis } from 'lucide-react';

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
              <img src={profile.imageUrl || ''} alt={`Profile preview`} className="h-8 w-8 rounded-sm object-cover bg-secondary" />
              {capitalize(toWords(profile.id))}
              <div className='grid grid-cols-3'>
                <span>{Math.round(profile.pixelCounts?.opaquePercentage ?? 0)}%</span>
                <span>{Math.round(profile.pixelCounts?.transparentPercentage ?? 0)}%</span>
                <span>{Math.round(profile.pixelCounts?.semiTransparentPercentage ?? 0)}%</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger><Ellipsis className="w-4 h-4 text-muted-foreground" /></DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Change image</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteProfile(profile.id)}>Delete profile</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
            </TabsTrigger>
          ))}
        </TabsList>
        </div>
        
      </Tabs>
    </div>
  );
};


export default ProfileManager;
