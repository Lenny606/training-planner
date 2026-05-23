import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, RefreshCw, AlertTriangle } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  badgeColorClass?: string;
}

export interface SelectButtonProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  loadOptions?: () => Promise<SelectOption[]>;
  options?: SelectOption[];
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  searchable?: boolean;
  containerClassName?: string;
  dropdownClassName?: string;
}

export const SelectButton: React.FC<SelectButtonProps> = ({
  label,
  placeholder = 'Vyberte možnost...',
  value,
  onChange,
  loadOptions,
  options: staticOptions,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  searchable = true,
  containerClassName = '',
  dropdownClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<SelectOption[]>(staticOptions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isFetched = useRef(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync static options if they change
  useEffect(() => {
    if (staticOptions) {
      setOptions(staticOptions);
    }
  }, [staticOptions]);

  // Load options dynamically from loadOptions promise
  const fetchOptions = async (force = false) => {
    if (!loadOptions || (isFetched.current && !force)) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadOptions();
      setOptions(data);
      isFetched.current = true;
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání dat');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when opened for the first time
  const handleToggle = () => {
    if (disabled) return;
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && loadOptions) {
      fetchOptions();
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Find currently selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search query
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (opt.badge && opt.badge.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Styling variations for the trigger button
  const triggerVariantClasses = {
    primary: 'bg-gradient-to-r from-[#00f2fe]/10 to-[#4facfe]/10 text-[#00f2fe] border border-[#00f2fe]/30 hover:border-[#00f2fe]/65',
    secondary: 'bg-[#1b202c]/65 hover:bg-[#1b202c]/95 text-[#f3f6f9] border border-white/5 hover:border-white/12',
    accent: 'bg-[#ff5e62]/10 hover:bg-[#ff5e62]/20 text-[#ff5e62] border border-[#ff5e62]/30',
    outline: 'bg-transparent text-[#00f2fe] border border-[#00f2fe]/30 hover:bg-[#00f2fe]/10',
    ghost: 'bg-transparent text-[#8292a6] hover:bg-white/5 hover:text-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-xs rounded-xl gap-2',
    lg: 'px-5 py-3.5 text-sm rounded-2xl gap-2.5'
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#8292a6] font-outfit">
          {label}
        </span>
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between font-semibold tracking-wide transition-all duration-300 outline-none select-none active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${triggerVariantClasses[variant]} ${sizeClasses[size]}`}
      >
        <div className="flex items-center gap-2 overflow-hidden text-left">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.badge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${selectedOption.badgeColorClass || 'bg-white/5 text-white/70 border-white/10'}`}>
                  {selectedOption.badge}
                </span>
              )}
              <span className="font-semibold text-[#f3f6f9] truncate">{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-[#8292a6]/50 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isLoading && <RefreshCw className="w-3.5 h-3.5 text-[#00f2fe] animate-spin" />}
          <ChevronDown className={`w-4 h-4 text-[#8292a6] transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} />
        </div>
      </button>

      {/* Dropdown Options Overlay */}
      {isOpen && (
        <div className={`absolute z-50 top-full mt-2 w-full glass-panel rounded-2xl overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.5)] border border-white/5 animate-[fadeIn_0.2s_ease-out] max-h-[350px] flex flex-col ${dropdownClassName}`}>
          {/* Custom animated border on top */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#00f2fe] to-transparent w-full"></div>

          {/* Search bar inside dropdown */}
          {searchable && !isLoading && !error && (
            <div className="p-3 border-b border-white/5 relative flex items-center bg-[#0d0f14]/85">
              <Search className="w-3.5 h-3.5 absolute left-6 text-[#8292a6]/60" />
              <input
                type="text"
                autoFocus
                placeholder="Hledat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#07090d] border border-white/5 focus:border-[#00f2fe]/45 text-xs pl-9 pr-4 py-2 rounded-xl text-[#f3f6f9] outline-none transition-all"
              />
              {options.length > 0 && loadOptions && (
                <button
                  type="button"
                  onClick={() => fetchOptions(true)}
                  title="Obnovit data"
                  className="ml-2 p-2 hover:bg-white/5 rounded-lg text-[#8292a6] hover:text-[#00f2fe] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Options List Container */}
          <div className="overflow-y-auto flex-1 custom-scrollbar bg-[#0d0f14]/75">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[#8292a6]">
                <RefreshCw className="w-6 h-6 text-[#00f2fe] animate-spin" />
                <span>Načítání z databáze...</span>
              </div>
            ) : error ? (
              <div className="py-10 px-4 flex flex-col items-center justify-center gap-2 text-center text-xs text-rose-400">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => fetchOptions(true)}
                  className="mt-2 text-[10px] uppercase font-bold tracking-wider px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-md hover:bg-rose-500/30 transition-all"
                >
                  Zkusit znovu
                </button>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#8292a6]/50 italic">
                Nebyly nalezeny žádné záznamy.
              </div>
            ) : (
              <div className="p-1.5 flex flex-col gap-1">
                {filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex flex-col gap-0.5 cursor-pointer relative group ${
                        isSelected
                          ? 'bg-[#00f2fe]/10 text-white border-l-2 border-[#00f2fe]'
                          : 'hover:bg-white/[0.03] text-[#8292a6] hover:text-[#f3f6f9]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className={`font-semibold text-xs transition-colors ${isSelected ? 'text-[#00f2fe]' : 'group-hover:text-[#00f2fe]'}`}>
                          {option.label}
                        </span>
                        {option.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${option.badgeColorClass || 'bg-white/5 text-white/70 border-white/10'}`}>
                            {option.badge}
                          </span>
                        )}
                      </div>
                      
                      {option.subLabel && (
                        <span className="text-[10px] text-[#8292a6]/70 truncate max-w-full font-sans">
                          {option.subLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
