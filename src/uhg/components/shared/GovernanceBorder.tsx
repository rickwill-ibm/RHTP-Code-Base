import React from 'react';

interface GovernanceBorderProps {
  children: React.ReactNode;
  state?: 'purple' | 'amber' | 'none';
  className?: string;
}

export default function GovernanceBorder({
  children,
  state = 'purple',
  className = '',
}: GovernanceBorderProps) {
  const borderClass =
    state === 'purple' ?'governance-border-purple'
      : state === 'amber' ?'governance-border-amber' :'';

  return (
    <div className={`rounded ${borderClass} ${className} transition-all duration-700`}>
      {children}
    </div>
  );
}