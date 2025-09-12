"use client";

interface AvatarBadgeProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'away';
  className?: string;
}

export default function AvatarBadge({
  name,
  size = 'md',
  status,
  className = ''
}: AvatarBadgeProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8 text-xs';
      case 'lg':
        return 'h-12 w-12 text-lg';
      default:
        return 'h-10 w-10 text-sm';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`${getSizeClasses()} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold`}>
        {getInitials(name)}
      </div>
      
      {status && (
        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 ${getStatusColor()} rounded-full border-2 border-[#1a1a1f]`} />
      )}
    </div>
  );
}
