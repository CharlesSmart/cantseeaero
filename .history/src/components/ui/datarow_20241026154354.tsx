import React from 'react';
import { Input } from "@/components/ui/input";

export const DataRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
    return (
        <div className='grid grid-cols-2 text-sm text-muted-foreground'>
            <p>{label}</p>
            <p className='text-right font-mono text-secondary-foreground'>{value}%</p>
        </div>
    );
};

export const DataRowWithInput: React.FC<{
    label: string;
    value: string | number | undefined;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    unit?: string;
}> = ({ label, value, onChange, disabled, unit }) => {
    return (
        <div className='grid grid-cols-2 gap-8 text-sm text-secondary-foreground items-center'>
            <p>{label}</p>
            <div className='grid items-center'>
            <Input value={value !== undefined ? value : ''} onChange={onChange} className='w-20 justify-self-end font-mono disabled:text-secondary-foreground' disabled={disabled} />
            {unit && <p className='absolute right-8 text-right text-muted-foreground'>{unit}</p>}
            </div>
        </div>
    );
};

