"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionItem {
  id: string;
  title: string;
  content: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export default function Accordion({ items, className = '' }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {items.map((item, index) => {
        const isOpen = openItems.includes(item.id);
        const isAboveOpen = index > 0 && openItems.includes(items[index - 1].id);
        const isBelowOpen = index < items.length - 1 && openItems.includes(items[index + 1].id);
        
        return (
          <div
            key={item.id}
            className={`bg-[#1A1A1F] border rounded-lg overflow-hidden transition-all duration-300 hover:border-neutral-600/50 ${
              isOpen 
                ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' 
                : 'border-neutral-700/50'
            } ${
              isAboveOpen ? 'mt-2' : ''
            } ${
              isBelowOpen ? 'mb-2' : ''
            }`}
            style={{
              transform: isOpen ? 'scale(1.02)' : 'scale(1)',
              zIndex: isOpen ? 10 : 1,
              position: 'relative'
            }}
          >
            {/* Accordion Header */}
            <button
              onClick={() => toggleItem(item.id)}
              className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all duration-200 ${
                isOpen 
                  ? 'bg-blue-500/10 hover:bg-blue-500/20' 
                  : 'hover:bg-neutral-800/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full transition-all duration-200 ${
                  isOpen 
                    ? 'bg-blue-500/20 scale-110' 
                    : 'bg-neutral-700/50'
                }`}>
                  <span className="text-lg">{getSeverityIcon(item.severity)}</span>
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium transition-colors duration-200 ${
                      isOpen ? 'text-blue-300' : 'text-white'
                    }`}>
                      {item.title}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                      isOpen 
                        ? 'bg-blue-500/30 text-blue-300 border-blue-500/50' 
                        : getSeverityColor(item.severity)
                    }`}>
                      {item.severity.toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-xs transition-colors duration-200 ${
                    isOpen ? 'text-blue-400' : 'text-neutral-400'
                  }`}>
                    {item.timestamp}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs transition-colors duration-200 ${
                  isOpen ? 'text-blue-400' : 'text-neutral-500'
                }`}>
                  {isOpen ? 'Hide' : 'Show'} Details
                </span>
                <div className={`p-1 rounded-full transition-all duration-200 ${
                  isOpen 
                    ? 'bg-blue-500/20 rotate-180' 
                    : 'bg-neutral-700/50'
                }`}>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-blue-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Accordion Content */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-4 pb-4 pt-2 border-t border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-transparent">
                <div className="text-sm text-neutral-300 leading-relaxed mb-3">
                  {item.content}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-md hover:bg-blue-600/30 transition-all duration-200 hover:scale-105">
                    Mark as Read
                  </button>
                  <button className="px-3 py-1 bg-neutral-600/20 text-neutral-400 text-xs rounded-md hover:bg-neutral-600/30 transition-all duration-200 hover:scale-105">
                    Dismiss
                  </button>
                  <button className="px-3 py-1 bg-green-600/20 text-green-400 text-xs rounded-md hover:bg-green-600/30 transition-all duration-200 hover:scale-105">
                    Take Action
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
