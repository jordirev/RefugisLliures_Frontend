import React from 'react';
import { Map, Heart, Wrench, User } from 'lucide-react';
import { Button } from './ui/button';

export type NavigationTab = 'map' | 'favorites' | 'reforms' | 'profile';

interface BottomNavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    {
      id: 'map' as NavigationTab,
      icon: Map,
    },
    {
      id: 'favorites' as NavigationTab,
      icon: Heart,
    },
    {
      id: 'reforms' as NavigationTab,
      icon: Wrench,
    },
    {
      id: 'profile' as NavigationTab,
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border safe-area-pb">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center h-16 rounded-none ${
                isActive 
                  ? 'text-primary bg-primary/5' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : ''}`} />
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-primary rounded-t-full" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}