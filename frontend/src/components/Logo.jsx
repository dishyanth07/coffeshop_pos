import React from 'react';
import logoImg from '../assets/logo.png';

const Logo = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-16 h-16',
        md: 'w-28 h-28',
        lg: 'w-48 h-48',
        xl: 'w-52 h-52'
    };

    const s = sizes[size] || sizes.md;

    return (
        <div className={`relative flex items-center justify-center ${s} ${className}`}>
            <img
                src={logoImg}
                alt="Power House"
                className="w-full h-full object-contain"
            />
        </div>
    );
};

export default Logo;
