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
    const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div className={`grid grid-cols-2 gap-8 text-sm items-center`}>
            <label htmlFor={inputId} className='text-foreground'>{label}</label>
            <div className='grid items-center'>
                <Input
                    id={inputId}
                    type='number'
                    value={inputValue}
                    onChange={onChange}
                    className={`w-20 justify-self-end font-mono disabled:text-foreground disabled:opacity-100 ${variant === 'priority' ? 'bg-info border-none text-info-foreground' : 'bg-card'}`}
                    disabled={disabled}
                    aria-label={`${label} value in ${unit || ''}`}
                />
                {unit && <span className={`absolute right-8 text-right ${variant === 'priority' ? 'text-info-foreground' : 'text-muted-foreground'}`} aria-hidden="true">{unit}</span>}
            </div>
        </div>
    );
};

