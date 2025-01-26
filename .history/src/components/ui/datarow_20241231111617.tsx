import React from 'react';
import { Input } from "@/components/ui/input";

export const DataRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
    return (
        <div className='grid grid-cols-2 text-sm text-muted-foreground'>
            <p>{label}</p>
            <p className='text-right font-mono text-muted-foreground'>{value}%</p>
        </div>
    );
};

export const DataRowWithInput: React.FC<{
    label: string;
    value: string | number | undefined;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    variant?: 'default' | 'priority';
    unit?: string;
}> = ({ label, value, onChange, disabled, unit, variant }) => {
    const inputValue = value !== undefined && !isNaN(Number(value)) ? value : '';

    return (
        <div className={`grid grid-cols-2 gap-8 text-sm  items-center`}>
            <p>{label}</p>
            <div className='grid items-center'>
                <Input
                    type='number'
                    value={inputValue}
                    onChange={onChange}
                    className={`w-20 justify-self-end font-mono disabled:text-secondary-foreground disabled:opacity-100 ${variant === 'priority' ? 'bg-blue-50 border-none' : 'bg-card'}`}
                    disabled={disabled}
                />
                {unit && <p className='absolute right-8 text-right text-muted-foreground'>{unit}</p>}
            </div>
        </div>
    );
};

