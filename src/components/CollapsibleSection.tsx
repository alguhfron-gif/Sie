import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Hook to manage persisted section visibility state in localStorage
 */
export function useCollapsibleSection(sectionId: string, defaultOpen = true) {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('section_visibility_states');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed[sectionId] === 'boolean') {
          return parsed[sectionId];
        }
      }
    } catch (e) {
      console.warn('Failed to read section_visibility_states from localStorage:', e);
    }
    return defaultOpen;
  });

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        const saved = localStorage.getItem('section_visibility_states');
        const current = saved ? JSON.parse(saved) : {};
        current[sectionId] = next;
        localStorage.setItem('section_visibility_states', JSON.stringify(current));
      } catch (e) {
        console.warn('Failed to save section_visibility_states to localStorage:', e);
      }
      return next;
    });
  };

  return { isOpen, toggleOpen, setIsOpen };
}

interface SectionToggleBtnProps {
  isOpen: boolean;
  onToggle: () => void;
  labelOpen?: string;
  labelClosed?: string;
  className?: string;
}

export const SectionToggleBtn: React.FC<SectionToggleBtnProps> = ({
  isOpen,
  onToggle,
  labelOpen = 'Sembunyikan',
  labelClosed = 'Tampilkan',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/90 transition-all flex items-center space-x-1.5 border border-slate-200 text-xs font-bold cursor-pointer shrink-0 ${className}`}
      title={isOpen ? 'Sembunyikan Bagian Ini' : 'Tampilkan Bagian Ini'}
      aria-expanded={isOpen}
    >
      <span className="hidden sm:inline text-[11px] font-semibold text-slate-700">
        {isOpen ? labelOpen : labelClosed}
      </span>
      <ChevronDown
        className={`w-4 h-4 text-slate-600 transition-transform duration-300 ease-in-out ${
          isOpen ? 'rotate-180' : 'rotate-0'
        }`}
      />
    </button>
  );
};

interface CollapsibleSectionProps {
  sectionId: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  headerActions?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  noPadding?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  sectionId,
  title,
  subtitle,
  icon,
  badge,
  headerActions,
  defaultOpen = true,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  noPadding = false,
}) => {
  const { isOpen, toggleOpen } = useCollapsibleSection(sectionId, defaultOpen);

  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all duration-300 ${className}`}>
      {/* Header Bar */}
      <div
        onClick={toggleOpen}
        className={`p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition-colors cursor-pointer select-none ${headerClassName}`}
      >
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          {icon && <div className="shrink-0 text-[#005a2b]">{icon}</div>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <div className="text-sm sm:text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                {title}
              </div>
              {badge && <div>{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 ml-auto">
          {headerActions && (
            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
              {headerActions}
            </div>
          )}

          <SectionToggleBtn isOpen={isOpen} onToggle={toggleOpen} />
        </div>
      </div>

      {/* Content Area */}
      {isOpen && (
        <div className={`transition-all duration-300 ease-in-out ${noPadding ? '' : 'p-4 sm:p-5'} ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
};
