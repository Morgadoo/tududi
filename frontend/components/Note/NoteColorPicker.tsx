import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ColorOption {
    name: string;
    value: string;
}

interface NoteColorPickerProps {
    colors: ColorOption[];
    selectedColor: string | undefined;
    onColorChange: (color: string) => void;
}

const NoteColorPicker: React.FC<NoteColorPickerProps> = ({
    colors,
    selectedColor,
    onColorChange,
}) => {
    return (
        <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Background Color
            </div>
            <div className="grid grid-cols-5 gap-2">
                {colors.map((colorOption) => {
                    const isSelected = selectedColor === colorOption.value;
                    const borderClass = isSelected
                        ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800'
                        : 'border-gray-300 dark:border-gray-600';

                    return (
                        <button
                            key={colorOption.value}
                            onClick={() => onColorChange(colorOption.value)}
                            className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 flex items-center justify-center ${borderClass}`}
                            style={{
                                backgroundColor: colorOption.value || '#ffffff',
                            }}
                            title={colorOption.name}
                            aria-label={`Set background to ${colorOption.name}`}
                        >
                            {!colorOption.value && (
                                <XMarkIcon className="h-5 w-5 text-gray-400" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default NoteColorPicker;
