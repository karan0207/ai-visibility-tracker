'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Sparkles, Zap, ListChecks, Layers } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';

interface MultiPromptFormProps {
  onSubmit: (category: string, brands: string[], prompts: string[]) => void;
  isLoading: boolean;
  initialCategory?: string;
  initialBrands?: string[];
}

const EXAMPLE_PROMPTS = [
  'What is the best {category}?',
  'Top 5 {category} for small businesses',
  'Which {category} is most affordable?',
  'Compare the best {category} options',
  'What {category} do experts recommend?',
];

export function MultiPromptForm({ onSubmit, isLoading, initialCategory = '', initialBrands = [] }: MultiPromptFormProps) {
  const [category, setCategory] = useState(initialCategory);
  const [brands, setBrands] = useState<string[]>(initialBrands);
  const [brandInput, setBrandInput] = useState('');
  const [prompts, setPrompts] = useState<string[]>([]);
  const [promptInput, setPromptInput] = useState('');
  const [errors, setErrors] = useState<{ category?: string; brands?: string; prompts?: string }>({});

  // Sync with initial values when they change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialBrands.length > 0) setBrands(initialBrands);
  }, [initialBrands]);
  const addBrands = () => {
    const trimmed = brandInput.trim();
    if (!trimmed) return;
    const newBrands = trimmed
      .split(/[\,\n]/)
      .map(b => b.trim())
      .filter(Boolean)
      .filter(b => !brands.some(existing => existing.toLowerCase() === b.toLowerCase()));
    if (brands.length + newBrands.length > APP_CONFIG.maxBrands) {
      setErrors(prev => ({ ...prev, brands: `Maximum ${APP_CONFIG.maxBrands} brands allowed` }));
      return;
    }
    if (newBrands.length === 0) {
      setErrors(prev => ({ ...prev, brands: 'Brand(s) already added or empty input' }));
      return;
    }
    setBrands([...brands, ...newBrands]);
    setBrandInput('');
    setErrors(prev => ({ ...prev, brands: undefined }));
  };

  const removeBrand = (brand: string) => {
    setBrands(brands.filter(b => b !== brand));
  };

  const handleBrandKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBrands();
    }
  };

  const addPrompt = () => {
    const trimmed = promptInput.trim();
    if (!trimmed) return;

    if (prompts.length >= 20) {
      setErrors(prev => ({ ...prev, prompts: 'Maximum 20 prompts allowed' }));
      return;
    }

    if (prompts.includes(trimmed)) {
      setErrors(prev => ({ ...prev, prompts: 'Prompt already added' }));
      return;
    }

    setPrompts([...prompts, trimmed]);
    setPromptInput('');
    setErrors(prev => ({ ...prev, prompts: undefined }));
  };

  const removePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const addExamplePrompts = () => {
    const categoryPlaceholder = category.trim() || '{category}';
    const newPrompts = EXAMPLE_PROMPTS
      .map(p => p.replace('{category}', categoryPlaceholder))
      .filter(p => !prompts.includes(p));
    
    const toAdd = newPrompts.slice(0, 20 - prompts.length);
    setPrompts([...prompts, ...toAdd]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPrompt();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    


    const newErrors: { category?: string; brands?: string; prompts?: string } = {};
    
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

    if (prompts.length < 1) {
      newErrors.prompts = 'Please add at least 1 prompt';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(category.trim(), brands, prompts);
  };

  return (
    <Card className="bg-white dark:bg-slate-900">
      <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
          Multi-Prompt Analysis
        </CardTitle>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Run multiple custom prompts in parallel batches of {APP_CONFIG.parallelBatchSize}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5 md:space-y-6 px-4 sm:px-6">
        {/* Features badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { icon: Zap, label: `${APP_CONFIG.parallelBatchSize} Parallel` },
            { icon: ListChecks, label: 'Custom Prompts', color: 'purple' },
            { icon: Sparkles, label: 'Batch Processing' },
          ].map(({ icon: Icon, label, color }) => (
            <span
              key={label}
              style={color === 'purple' ? { background: '#f7f2fa', color: '#62109F', border: '1px solid #e5d0f7' } : {}}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border transition-all ${color === 'purple' ? '' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {label}
            </span>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6 ">
          {/* Category Input */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="mp-category" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Product Category
              </Label>
              <span className={`text-[10px] font-medium ${category.length > APP_CONFIG.maxCategoryLength ? 'text-red-500' : 'text-slate-400'}`}>
                {category.length}/{APP_CONFIG.maxCategoryLength}
              </span>
            </div>
            <Input
              id="mp-category"
              placeholder="e.g., CRM software, project management tools"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
              className={`h-10 sm:h-12 px-3 sm:px-4 text-sm sm:text-base bg-[#f7f2fa] dark:bg-purple-900/10 border-[#e5d0f7] dark:border-slate-800 focus:border-none focus:ring-0 focus:bg-white dark:focus:bg-slate-900 transition-all ${errors.category ? 'border-red-400' : ''}`}
            />
            {errors.category && (
              <p className="text-xs sm:text-sm text-red-500 font-medium">{errors.category}</p>
            )}
          </div>

          {/* Brands Input */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Brands to Track
              </Label>
              <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                brands.length >= APP_CONFIG.maxBrands
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {brands.length}/{APP_CONFIG.maxBrands} brands
              </span>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="OpenAI, Claude, DeepSeek..."
                value={brandInput}
                onChange={(e) => {
                  setBrandInput(e.target.value.slice(0, 32));
                  setErrors(prev => ({ ...prev, brands: undefined }));
                }}
                onKeyDown={handleBrandKeyDown}
                className="flex-1 h-11 px-4 text-sm rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                disabled={isLoading || brands.length >= APP_CONFIG.maxBrands}
                maxLength={32}
              />
              <Button
                type="button"
                onClick={addBrands}
                disabled={isLoading || !brandInput.trim() || brands.length >= APP_CONFIG.maxBrands}
                size="lg"
                variant="outline"
                className="h-11 px-4 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.brands && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded-md border border-red-100">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500 shrink-0"></span>
                {errors.brands}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Max 32 characters per brand</p>
            {/* Added brands */}
            {brands.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg" style={{ background: '#f7f2fa', border: '1px solid #e5d0f7' }}>
                {brands.map((brand) => (
                  <Badge 
                    key={brand} 
                    style={{ backgroundColor: '#62109F', color: '#fff', border: '1px solid #62109F' }}
                    className="pl-2 sm:pl-3 pr-1.5 sm:pr-2 py-1 rounded-md transition-all cursor-pointer group shadow-sm text-xs sm:text-sm"
                    onClick={() => removeBrand(brand)}
                  >
                    {brand}
                    <X className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 ml-1 sm:ml-2" style={{ color: '#fff' }} />
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 pl-0.5 sm:pl-1">
                Enter brands comma-separated. Click a brand to remove it.
              </p>
            )}
          </div>

          {/* Prompts Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-400">
                Custom Prompts ({prompts.length}/20)
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addExamplePrompts}
                disabled={isLoading || prompts.length >= 20}
                className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 h-8 px-2"
              >
                <Plus className="h-3 w-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Add Examples</span>
                <span className="inline sm:hidden">Examples</span>
              </Button>
            </div>
            
            {/* Add Prompt Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter a prompt, e.g., 'Best CRM for startups'"
                value={promptInput}
                onChange={(e) => {
                  setPromptInput(e.target.value.slice(0, 160));
                  setErrors(prev => ({ ...prev, prompts: undefined }));
                }}
                onKeyDown={handleKeyDown}
                disabled={isLoading || prompts.length >= 20}
                maxLength={160}
                className="flex-1 h-9 sm:h-11 px-3 sm:px-4 text-sm bg-[#f7f2fa] dark:bg-purple-900/10 border-[#e5d0f7] dark:border-slate-800 focus:border-none focus:ring-0 focus:bg-white dark:focus:bg-slate-900"
              />
              <Button
                type="button"
                onClick={addPrompt}
                disabled={isLoading || !promptInput.trim() || prompts.length >= 20}
                variant="outline"
                className="h-9 sm:h-11 px-2.5 sm:px-4 border-purple-200 dark:border-purple-800 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {errors.prompts && (
              <p className="text-xs sm:text-sm text-red-500 font-medium">{errors.prompts}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">Max 160 characters per prompt</p>

            {/* Prompts List */}
            {prompts.length > 0 && (
              <div className="space-y-1.5 sm:space-y-2 max-h-40 sm:max-h-48 overflow-y-auto pr-1 sm:pr-2">
                {prompts.map((prompt, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/20 group transition-all"
                  >
                    <Badge className="shrink-0 mt-0 text-[10px] h-4 min-w-[16px] flex items-center justify-center p-0 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      <span style={{ background: '#62109F', color: '#fff', borderRadius: '4px', padding: '0 6px', display: 'inline-block', minWidth: '16px', textAlign: 'center' }}>{index + 1}</span>
                    </Badge>
                    <span className="flex-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 break-words leading-relaxed">
                      {prompt}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePrompt(index)}
                      disabled={isLoading}
                      className="shrink-0 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {prompts.length === 0 && (
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 text-center py-3 sm:py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                No prompts added yet. Add your own or click &quot;Add Examples&quot;
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading || !category.trim() || brands.length === 0 || prompts.length === 0} 
            size="lg"
            className="w-full h-11 sm:h-14 text-xs sm:text-base font-semibold bg-[linear-gradient(to_right,#1a0022_0%,#6b46c1_51%,#1a0022_100%)] bg-[length:200%_auto] hover:bg-[position:right_center] hover:shadow-xl hover:shadow-purple-500/25 text-white shadow-md transition-all duration-500"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="hidden sm:inline">Processing {prompts.length} prompts...</span>
                <span className="inline sm:hidden text-xs">Processing...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Analyze {prompts.length} Prompt{prompts.length !== 1 ? 's' : ''} in Parallel</span>
                <span className="inline sm:hidden">Analyze</span>
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
