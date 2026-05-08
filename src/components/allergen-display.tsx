'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Wheat,
  Egg,
  Fish,
  Milk,
  HelpCircle,
  Check,
  X,
} from 'lucide-react';

// Custom SVG icons for allergens not available in Lucide
const PeanutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c-1.5 0-3 1-3 3v2c0 1-1 2-2 2s-2 1-2 2.5c0 2 1.5 3.5 3 3.5h8c1.5 0 3-1.5 3-3.5 0-1.5-1-2.5-2-2.5s-2-1-2-2V6c0-2-1.5-3-3-3z"/>
    <ellipse cx="9" cy="14" rx="1" ry="1.5"/>
    <ellipse cx="12" cy="15" rx="1" ry="1.5"/>
    <ellipse cx="15" cy="14" rx="1" ry="1.5"/>
  </svg>
);

const TreeNutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8 2 5 5 5 9c0 3 1.5 5 3 7 1 1.5 2 3 2 5h4c0-2 1-3.5 2-5 1.5-2 3-4 3-7 0-4-3-7-7-7z"/>
    <path d="M12 6v4"/>
    <path d="M10 8h4"/>
  </svg>
);

const ShellfishIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3C7 3 4 7 4 12c0 3 1.5 5 4 6l1 3h6l1-3c2.5-1 4-3 4-6 0-5-3-9-8-9z"/>
    <path d="M9 12l3-3 3 3"/>
    <path d="M12 9v6"/>
  </svg>
);

const SoyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4"/>
    <path d="M8 4c0 0 4 2 4 6s-4 6-4 6"/>
    <path d="M16 4c0 0-4 2-4 6s4 6 4 6"/>
    <ellipse cx="12" cy="18" rx="3" ry="4"/>
  </svg>
);

const SesameIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3C8 3 5 6 5 10c0 2 .5 3.5 1.5 5l-1.5 4h14l-1.5-4c1-1.5 1.5-3 1.5-5 0-4-3-7-7-7z"/>
    <ellipse cx="9" cy="10" rx="1.5" ry="2"/>
    <ellipse cx="12" cy="12" rx="1.5" ry="2"/>
    <ellipse cx="15" cy="10" rx="1.5" ry="2"/>
  </svg>
);
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type AllergenType =
  | 'gluten'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'dairy'
  | 'tree_nuts'
  | 'shellfish'
  | 'soy'
  | 'sesame'
  | 'sulfites';

export interface AllergenInfo {
  type: AllergenType;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

export const allergenDefinitions: Record<AllergenType, AllergenInfo> = {
  gluten: {
    type: 'gluten',
    name: 'Gluten',
    icon: <Wheat className="h-4 w-4" />,
    description: 'Contains wheat, barley, rye, or their derivatives.',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  eggs: {
    type: 'eggs',
    name: 'Eggs',
    icon: <Egg className="h-4 w-4" />,
    description: 'Contains eggs or egg products.',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  fish: {
    type: 'fish',
    name: 'Fish',
    icon: <Fish className="h-4 w-4" />,
    description: 'Contains fish or fish products.',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  peanuts: {
    type: 'peanuts',
    name: 'Peanuts',
    icon: <PeanutIcon className="h-4 w-4" />,
    description: 'Contains peanuts or peanut products.',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  dairy: {
    type: 'dairy',
    name: 'Dairy',
    icon: <Milk className="h-4 w-4" />,
    description: 'Contains milk or dairy products.',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  },
  tree_nuts: {
    type: 'tree_nuts',
    name: 'Tree Nuts',
    icon: <TreeNutIcon className="h-4 w-4" />,
    description: 'Contains tree nuts like almonds, cashews, walnuts, etc.',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  shellfish: {
    type: 'shellfish',
    name: 'Shellfish',
    icon: <ShellfishIcon className="h-4 w-4" />,
    description: 'Contains crustaceans like shrimp, crab, lobster.',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
  soy: {
    type: 'soy',
    name: 'Soy',
    icon: <SoyIcon className="h-4 w-4" />,
    description: 'Contains soy or soy products.',
    color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  },
  sesame: {
    type: 'sesame',
    name: 'Sesame',
    icon: <SesameIcon className="h-4 w-4" />,
    description: 'Contains sesame seeds or sesame oil.',
    color: 'bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-400',
  },
  sulfites: {
    type: 'sulfites',
    name: 'Sulfites',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Contains sulfites, often found in wine and dried fruits.',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
};

interface AllergenBadgeProps {
  type: AllergenType;
  showTooltip?: boolean;
  compact?: boolean;
}

export function AllergenBadge({ type, showTooltip = true, compact = false }: AllergenBadgeProps) {
  const info = allergenDefinitions[type];

  if (!info) return null;

  const badge = (
    <Badge
      variant="outline"
      className={`${info.color} ${compact ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1'} flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity`}
    >
      {info.icon}
      {!compact && <span>{info.name}</span>}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{info.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

interface AllergenListProps {
  allergens: AllergenType[];
  className?: string;
  showHeader?: boolean;
}

export function AllergenList({ allergens, className = '', showHeader = true }: AllergenListProps) {
  return (
    <div className={className}>
      {showHeader && allergens.length > 0 && (
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
          <AlertTriangle className="h-4 w-4" />
          Allergen Information
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {allergens.length === 0 ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <Check className="h-3 w-3 mr-1" />
            No Major Allergens
          </Badge>
        ) : (
          allergens.map((allergen) => (
            <AllergenBadge key={allergen} type={allergen} />
          ))
        )}
      </div>
    </div>
  );
}

interface AllergenSelectorProps {
  selected: AllergenType[];
  onChange: (allergens: AllergenType[]) => void;
}

export function AllergenSelector({ selected, onChange }: AllergenSelectorProps) {
  const toggleAllergen = (type: AllergenType) => {
    if (selected.includes(type)) {
      onChange(selected.filter((a) => a !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Allergens</Label>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.values(allergenDefinitions).map((info) => (
          <button
            key={info.type}
            type="button"
            onClick={() => toggleAllergen(info.type)}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all ${
              selected.includes(info.type)
                ? `${info.color} border-current`
                : 'bg-muted/50 hover:bg-muted border-border'
            }`}
          >
            {info.icon}
            <span className="text-xs font-medium">{info.name}</span>
            {selected.includes(info.type) && (
              <Check className="h-3 w-3 ml-auto" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Import Label at the top
import { Label } from '@/components/ui/label';

interface AllergenLegendProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AllergenLegend({ open: controlledOpen, onOpenChange }: AllergenLegendProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <HelpCircle className="h-4 w-4 mr-2" />
        Allergen Guide
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Allergen Information Guide
            </DialogTitle>
            <DialogDescription>
              Common allergens found in our dishes. Please inform your server of any allergies.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {Object.values(allergenDefinitions).map((info) => (
              <motion.div
                key={info.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 p-3 rounded-lg ${info.color}`}
              >
                <div className="mt-0.5">{info.icon}</div>
                <div>
                  <div className="font-medium">{info.name}</div>
                  <div className="text-xs opacity-80">{info.description}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Important Notice</p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  While we indicate known allergens, cross-contamination may occur in our kitchen.
                  Please speak with our staff about severe allergies before ordering.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Example menu item with allergens
export function MenuItemWithAllergens({
  name,
  description,
  price,
  allergens,
  imageUrl,
}: {
  name: string;
  description: string;
  price: number;
  allergens: AllergenType[];
  imageUrl?: string;
}) {
  const [showAllergens, setShowAllergens] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-card border rounded-xl overflow-hidden transition-shadow hover:shadow-lg"
    >
      {imageUrl && (
        <div className="h-40 bg-muted">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg">{name}</h3>
          <span className="font-bold text-primary">${price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>

        <div className="flex items-center justify-between">
          <AllergenList allergens={allergens} showHeader={false} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllergens(true)}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Details
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
