import React from 'react';
import EmptyState from '@/components/EmptyState';
import { useProfileStore } from '@/store/profileStore';

interface EmptyStateDisplayProps {
  onOpenCamera: () => void;
}

const EmptyStateDisplay: React.FC<EmptyStateDisplayProps> = ({ onOpenCamera }) => {
  const profiles = useProfileStore((state) => state.profiles);

  if (profiles.every(profile => profile.uploadedImage === null)) {
    return (
      <EmptyState
        onOpenCamera={onOpenCamera}
        // Other props for EmptyState are now taken from store or not needed
      />
    );
  }
  return null;
};

export default EmptyStateDisplay;
