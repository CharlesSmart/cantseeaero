import React, { createContext, useState, useContext } from 'react';

interface ProfileComparisonType {
  imageUrlComparison: string;
  setImageUrlComparison: (url: string) => void;
}

const ProfileComparisonContext = createContext<ProfileComparisonType | undefined>(undefined);

export const ProfileComparisonProvider: React.FC = ({ children }) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  return (
    <ProfileComparisonContext.Provider value={{ imageUrl, setImageUrl }}>
      {children}
    </ProfileComparisonContext.Provider>
  );
};

export const useProfileComparisonContext = () => {
  const context = useContext(ProfileComparisonContext);
  if (!context) {
    throw new Error('useProfileComparisonContext must be used within an ProfileComparisonProvider');
  }
  return context;
};