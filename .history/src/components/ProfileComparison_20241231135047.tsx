import React, { createContext, useState, useContext } from 'react';

interface ProfileComparisonType {
  imageUrlComparison: string;
  setImageUrlComparison: (url: string) => void;
}

const ProfileComparisonContext = createContext<ProfileComparisonType | undefined>(undefined);

export const ProfileComparisonProvider: React.FC = ({ children }) => {
  const [imageUrlComparison, setImageUrlComparison] = useState<string>('');

  return (
    <ProfileComparisonContext.Provider value={{ imageUrlComparison, setImageUrlComparison }}>
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