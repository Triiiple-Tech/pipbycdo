import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronDown, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { cn } from '../../../lib/utils';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
}

const PRESET_RANGES = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date();
      return { from: today, to: today };
    }
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: yesterday };
    }
  },
  {
    label: 'Last 7 days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { from: start, to: end };
    }
  },
  {
    label: 'Last 30 days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return { from: start, to: end };
    }
  },
  {
    label: 'This month',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: start, to: end };
    }
  },
  {
    label: 'Last month',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: start, to: end };
    }
  },
  {
    label: 'This quarter',
    getValue: () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      return { from: start, to: end };
    }
  },
  {
    label: 'This year',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { from: start, to: end };
    }
  }
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  className,
  disabled = false,
  placeholder = 'Select date range',
  maxDate,
  minDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get display text for current selection
  const getDisplayText = () => {
    if (!value.from && !value.to) return placeholder;
    if (value.from && value.to) {
      if (value.from.getTime() === value.to.getTime()) {
        return formatDate(value.from);
      }
      return `${formatDate(value.from)} - ${formatDate(value.to)}`;
    }
    return value.from ? `From ${formatDate(value.from)}` : `Until ${formatDate(value.to)}`;
  };

  // Handle preset selection
  const handlePresetSelect = (preset: typeof PRESET_RANGES[0]) => {
    const range = preset.getValue();
    onChange(range);
    setSelectedPreset(preset.label);
    setShowCustom(false);
    setIsOpen(false);
  };

  // Handle custom date input
  const handleCustomDateChange = () => {
    const from = customFrom ? new Date(customFrom) : null;
    const to = customTo ? new Date(customTo) : null;
    
    if (from && to && from > to) {
      // Swap dates if from is after to
      onChange({ from: to, to: from });
    } else {
      onChange({ from, to });
    }
  };

  // Clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ from: null, to: null });
    setSelectedPreset(null);
    setCustomFrom('');
    setCustomTo('');
  };

  // Update custom inputs when value changes
  useEffect(() => {
    if (value.from) {
      setCustomFrom(value.from.toISOString().split('T')[0]);
    }
    if (value.to) {
      setCustomTo(value.to.toISOString().split('T')[0]);
    }
  }, [value]);

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full justify-between text-left font-normal',
          'border-gray-200 hover:border-[#E60023] focus:border-[#E60023]',
          'transition-all duration-200',
          !value.from && !value.to && 'text-gray-500'
        )}
      >
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="truncate">{getDisplayText()}</span>
        </div>
        <div className="flex items-center space-x-1">
          {(value.from || value.to) && (
            <X
              className="h-4 w-4 text-gray-400 hover:text-[#E60023] transition-colors"
              onClick={handleClear}
            />
          )}
          <ChevronDown className={cn(
            'h-4 w-4 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} />
        </div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <Card className="p-4 shadow-lg border-gray-200 bg-white/95 backdrop-blur-sm">
              <div className="space-y-4">
                {/* Preset Ranges */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Select</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_RANGES.map((preset) => (
                      <Button
                        key={preset.label}
                        variant={selectedPreset === preset.label ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePresetSelect(preset)}
                        className={cn(
                          'justify-start text-xs',
                          selectedPreset === preset.label
                            ? 'bg-[#E60023] hover:bg-[#CC001F] text-white'
                            : 'hover:border-[#E60023] hover:text-[#E60023]'
                        )}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Range Toggle */}
                <div className="border-t pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustom(!showCustom)}
                    className="w-full justify-between text-sm hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Custom Range</span>
                    </div>
                    <ChevronDown className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      showCustom && 'rotate-180'
                    )} />
                  </Button>

                  <AnimatePresence>
                    {showCustom && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">
                                From
                              </label>
                              <input
                                type="date"
                                value={customFrom}
                                onChange={(e) => setCustomFrom(e.target.value)}
                                onBlur={handleCustomDateChange}
                                min={minDate?.toISOString().split('T')[0]}
                                max={maxDate?.toISOString().split('T')[0]}
                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md focus:border-[#E60023] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">
                                To
                              </label>
                              <input
                                type="date"
                                value={customTo}
                                onChange={(e) => setCustomTo(e.target.value)}
                                onBlur={handleCustomDateChange}
                                min={minDate?.toISOString().split('T')[0]}
                                max={maxDate?.toISOString().split('T')[0]}
                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md focus:border-[#E60023] focus:outline-none"
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              handleCustomDateChange();
                              setSelectedPreset(null);
                              setIsOpen(false);
                            }}
                            className="w-full bg-[#E60023] hover:bg-[#CC001F] text-white text-xs"
                          >
                            Apply Custom Range
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DateRangeFilter;
