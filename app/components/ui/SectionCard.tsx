"use client";

import { LucideIcon, ChevronRight } from 'lucide-react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: string | React.ReactNode;
  onActionClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-400",
  action,
  onActionClick,
  children,
  className = ''
}: SectionCardProps) {
  return (
    <div className={`panel bg-[#1A1A1F] border-neutral-700/50 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {subtitle && (
              <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        {action && (
          typeof action === 'string' ? (
            onActionClick ? (
              <button
                onClick={onActionClick}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
              >
                <span>{action}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <span className="text-blue-400 text-sm font-medium">{action}</span>
            )
          ) : (
            action
          )
        )}
      </div>

      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  );
}
