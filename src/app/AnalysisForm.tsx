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
    <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900">
      <CardContent className="p-8">
        {/* Features badges */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {[
            { icon: Zap, label: '10 AI Queries' },
            { icon: Target, label: 'Brand Detection' },
            { icon: BarChart3, label: 'Instant Metrics' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Input */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Product Category
            </Label>
            <Input
              id="category"
              placeholder="e.g., CRM software, project management tools"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
              className={`h-12 px-4 text-base bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all ${errors.category ? 'border-red-400 focus:border-red-500' : ''}`}
            />
            {errors.category && (
              <p className="text-sm text-red-500 font-medium">{errors.category}</p>
            )}
          </div>

          {/* Brands Input */}
          <div className="space-y-2">
            <Label htmlFor="brands" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Brands to Track
            </Label>
            <Textarea
              id="brands"
              placeholder="Salesforce, HubSpot, Pipedrive, Zoho"
              rows={3}
              value={brandsText}
              onChange={(e) => setBrandsText(e.target.value)}
              disabled={isLoading}
              className={`px-4 py-3 text-base bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 resize-none transition-all ${errors.brands ? 'border-red-400 focus:border-red-500' : ''}`}
            />
            {errors.brands ? (
              <p className="text-sm text-red-500 font-medium">{errors.brands}</p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Enter {APP_CONFIG.minBrands}-{APP_CONFIG.maxBrands} brands, comma-separated
              </p>
            )}
          </div>

          {/* API Key Input (Collapsible/Optional) */}
          <details className="group">
            <summary className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform">→</span>
              Advanced: Use custom API key
            </summary>
            <div className="mt-3 space-y-2">
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-... (leave blank to use server default)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading}
                className="h-11 px-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
              <p className="text-xs text-slate-500">
                Your key is not stored.
              </p>
            </div>
          </details>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading} 
            size="lg"
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing visibility...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Analyze Brand Visibility
                <ArrowRight className="h-4 w-4 ml-1" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
