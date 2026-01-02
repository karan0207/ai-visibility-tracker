'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowRight, Zap, Target, BarChart3 } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';

interface AnalysisFormProps {
  onSubmit: (category: string, brands: string[], apiKey?: string) => void;
  isLoading: boolean;
}

export function AnalysisForm({ onSubmit, isLoading }: AnalysisFormProps) {
  const [category, setCategory] = useState('');
  const [brandsText, setBrandsText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [errors, setErrors] = useState<{ category?: string; brands?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const brands = brandsText
      .split(/[,\n]/)
      .map((b) => b.trim())
      .filter(Boolean);

    const newErrors: { category?: string; brands?: string } = {};
    
    if (!category.trim()) {
      newErrors.category = 'Category is required';
    } else if (category.length > APP_CONFIG.maxCategoryLength) {
      newErrors.category = `Category must be less than ${APP_CONFIG.maxCategoryLength} characters`;
    }

    if (brands.length < APP_CONFIG.minBrands) {
      newErrors.brands = `Please provide at least ${APP_CONFIG.minBrands} brands`;
    } else if (brands.length > APP_CONFIG.maxBrands) {
      newErrors.brands = `Maximum ${APP_CONFIG.maxBrands} brands allowed`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(category.trim(), brands, apiKey || undefined);
  };

  return (
    <Card className="bg-white dark:bg-slate-900">
      <CardContent className="p-4 sm:p-6 md:p-8">
        {/* Features badges */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 justify-center">
          {[
            { icon: Zap, label: '10 AI Queries' },
            { icon: Target, label: 'Brand Detection' },
            { icon: BarChart3, label: 'Instant Metrics' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {label}
            </span>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Category Input */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="category" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Product Category
            </Label>
            <span className={`text-[10px] font-medium ${category.length > APP_CONFIG.maxCategoryLength ? 'text-red-500' : 'text-slate-400'}`}>
              {category.length}/{APP_CONFIG.maxCategoryLength}
            </span>
          </div>
          <Input
            id="category"
            placeholder="e.g., CRM software, project management tools"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isLoading}
            className={`h-10 sm:h-12 px-3 sm:px-4 text-sm sm:text-base bg-indigo-50/20 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all ${errors.category ? 'border-red-400 focus:border-red-500' : ''}`}
          />
          {errors.category && (
            <p className="text-xs sm:text-sm text-red-500 font-medium">{errors.category}</p>
          )}
        </div>

        {/* Brands Input */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="brands" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Brands to Track
            </Label>
            <span className={`text-[10px] font-medium ${brandsText.split(/[,\n]/).filter(b => b.trim()).length > APP_CONFIG.maxBrands ? 'text-red-500' : 'text-slate-400'}`}>
              {brandsText.split(/[,\n]/).filter(b => b.trim()).length}/{APP_CONFIG.maxBrands} brands
            </span>
          </div>
          <Textarea
            id="brands"
            placeholder="Salesforce, HubSpot, Pipedrive, Zoho"
            rows={2}
            value={brandsText}
            onChange={(e) => setBrandsText(e.target.value)}
            disabled={isLoading}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-indigo-50/20 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 resize-none transition-all ${errors.brands ? 'border-red-400 focus:border-red-500' : ''}`}
          />
            {errors.brands ? (
              <p className="text-xs sm:text-sm text-red-500 font-medium">{errors.brands}</p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Enter {APP_CONFIG.minBrands}-{APP_CONFIG.maxBrands} brands, comma-separated
              </p>
            )}
          </div>

          {/* API Key Input (Collapsible/Optional) */}
          <details className="group">
            <summary className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform">→</span>
              Advanced: Use custom API key
            </summary>
            <div className="mt-2 sm:mt-3 space-y-2">
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-... (leave blank to use server default)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading}
                className="h-10 sm:h-11 px-3 sm:px-4 text-sm bg-indigo-50/20 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
              <p className="text-xs text-slate-500">
                Your key is not stored. Using Ollama? Leave blank.
              </p>
            </div>
          </details>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading} 
            size="lg"
            className="w-full h-11 sm:h-14 text-xs sm:text-base font-semibold bg-gradient-brand text-white shadow-md transition-all duration-200"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing visibility...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Analyze Brand Visibility</span>
                <span className="inline sm:hidden">Analyze</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
