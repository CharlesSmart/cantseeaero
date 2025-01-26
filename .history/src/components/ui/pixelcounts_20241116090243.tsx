import React from 'react';

export const PixelCountsUI: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
    return (
        <div className='grid grid-cols-2 text-sm text-muted-foreground'>
            <p>{label}</p>
            <p className='text-right font-mono text-muted-foreground'>{value}%</p>
        </div>
    );
};


