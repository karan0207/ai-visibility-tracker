'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Target, Zap, ArrowRight, Settings2 } from 'lucide-react';

interface SessionSetupProps {
  onStart: (category: string, brands: string[]) => void;
  onBrandsChange?: (brands: string[]) => void;
  initialBrands?: string[];
  initialCategory?: string;
  isActive?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

export function SessionSetup({ onStart, onBrandsChange, initialBrands = [], initialCategory = '', isActive = false, compact = false, disabled = false }: SessionSetupProps) {
  const [brands, setBrands] = useState<string[]>(initialBrands);
  const [category, setCategory] = useState(initialCategory);
  const [brandInput, setBrandInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync with parent when initialBrands changes
  useEffect(() => {
    if (isActive) {
      setBrands(initialBrands);
    }
  }, [initialBrands, isActive]);

  const updateBrands = (newBrands: string[]) => {
    setBrands(newBrands);
    if (isActive && onBrandsChange) {
      onBrandsChange(newBrands);
    }
  };

  const addBrands = () => {
    const trimmed = brandInput.trim();
    if (!trimmed) return;
    
    // Split by comma or newline and process each brand
    const newBrands = trimmed
      .split(/[,\n]/)
      .map(b => b.trim())
      .filter(Boolean)
      .filter(b => !brands.some(existing => existing.toLowerCase() === b.toLowerCase()));
    
    if (brands.length + newBrands.length > 10) {
      setError(`Maximum 10 brands allowed. You can add ${10 - brands.length} more.`);
      return;
    }
    
    if (newBrands.length === 0) {
      setError('Brand(s) already added or empty input');
      return;
    }
    
    updateBrands([...brands, ...newBrands]);
    setBrandInput('');
    setError(null);
  };

  const removeBrand = (brand: string) => {
    updateBrands(brands.filter(b => b !== brand));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBrands();
    }
  };

  const handleStart = () => {
    if (!category.trim()) {
      setError('Please enter a product category');
      return;
    }
    if (brands.length < 1) {
      setError('Please add at least 1 brand to track');
      return;
    }
    onStart(category.trim(), brands);
  };

  if (isActive && compact) {
    // Compact sidebar mode - just the add brand input
    return (
      <div className="space-y-2 sm:space-y-3">
        <div className="flex gap-1.5 sm:gap-2">
          <Input
            placeholder="Add brand..."
            value={brandInput}
            onChange={(e) => {
              setBrandInput(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 h-7 sm:h-8 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-md"
          />
          <Button 
            size="sm" 
            variant="outline" 
            onClick={addBrands}
            disabled={!brandInput.trim()}
            className="h-7 sm:h-8 px-1.5 sm:px-2 rounded-md"
          >
            <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Button>
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        <p className="text-xs text-slate-400">
          Comma-separated or one at a time
        </p>
      </div>
    );
  }

  if (isActive) {
    return (
      <Card className="border border-slate-200 shadow-sm bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                  {category}
                </p>
                <div className="flex flex-wrap gap-1">
                  {brands.map((brand) => (
                    <Badge 
                      key={brand} 
                      variant="secondary" 
                      className="text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer group border border-slate-200"
                      onClick={() => removeBrand(brand)}
                    >
                      <span className="hidden sm:inline">{brand}</span>
                      <span className="inline sm:hidden text-xs">{brand.slice(0, 4)}</span>
                      <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Input
                placeholder="Add..."
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-24 sm:w-40 h-8 sm:h-9 text-xs sm:text-sm rounded-md bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={addBrands}
                disabled={!brandInput.trim()}
                className="h-8 sm:h-9 w-8 sm:w-9 p-0 rounded-md"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 shadow-sm bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl overflow-hidden">
      <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
          <Settings2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
          Setup Your Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 sm:space-y-8 pt-6 sm:pt-8 px-4 sm:px-6">
        {/* Features badges */}
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
          {[
            { icon: Zap, label: 'Custom Prompts', color: 'purple' },
            { icon: Target, label: 'Real-time Tracking' },
          ].map(({ icon: Icon, label, color }) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium uppercase tracking-wider border transition-all ${
                color === 'purple'
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {label}
            </span>
          ))}
        </div>

        {/* Category Input */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-0.5 sm:ml-1">
              Product Category
            </Label>
            <span className={`text-[10px] font-medium ${category.length > 50 ? 'text-amber-500' : 'text-slate-400'}`}>
              {category.length}/100
            </span>
          </div>
          <Input
            placeholder="e.g., CRM software, AI coding assistants..."
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setError(null);
            }}
            className="h-9 sm:h-10 px-2.5 sm:px-3 text-sm rounded-lg bg-indigo-50/20 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 focus:border-purple-400 focus:ring-purple-200 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
        </div>

        {/* Brands Input */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-0.5 sm:ml-1">
              Brands to Track
            </Label>
            <span className={`text-[10px] font-medium ${brands.length >= 10 ? 'text-red-500' : 'text-slate-400'}`}>
              {brands.length}/10 brands
            </span>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <Input
              placeholder="OpenAI, Claude, DeepSeek..."
              value={brandInput}
              onChange={(e) => {
                setBrandInput(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 h-9 sm:h-10 px-2.5 sm:px-3 text-sm rounded-lg bg-indigo-50/20 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 focus:border-purple-400 focus:ring-purple-200 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
            <Button 
              type="button" 
              onClick={addBrands} 
              disabled={!brandInput.trim()}
              size="lg"
              variant="outline"
              className="h-9 sm:h-10 px-2 sm:px-4 rounded-lg border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded-md border border-red-100">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500 shrink-0"></span>
              {error}
            </div>
          )}

          {/* Added brands */}
          {brands.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              {brands.map((brand) => (
                <Badge 
                  key={brand} 
                  className="pl-2 sm:pl-3 pr-1.5 sm:pr-2 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer group shadow-sm text-xs sm:text-sm"
                  onClick={() => removeBrand(brand)}
                >
                  {brand}
                  <X className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 ml-1 sm:ml-2 text-slate-400 group-hover:text-red-500 transition-colors" />
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 pl-0.5 sm:pl-1">
              Enter brands comma-separated. Click a brand to remove it.
            </p>
          )}
        </div>

        {/* Start Button */}
        <Button 
          onClick={handleStart}
          disabled={brands.length < 1 || disabled}
          size="lg"
          className="w-full h-10 sm:h-12 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-brand text-white shadow-md transition-all duration-200"
        >
          <span className="flex items-center gap-2">
            {disabled ? 'Creating Session...' : 'Start Analysis Session'}
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
          </span>
        </Button>
        
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
          You can add or remove brands during the session
        </p>
      </CardContent>
    </Card>
  );
}
