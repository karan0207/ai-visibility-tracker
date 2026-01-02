'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, XCircle, Sparkles, ExternalLink, Quote } from 'lucide-react';
import type { PromptResult } from '@/types/analysis';

interface PromptListProps {
  prompts: PromptResult[];
  targetBrand?: string;
}

/**
 * Simple markdown renderer for AI responses
 * Handles: **bold**, *italic*, - lists, numbered lists, headers
 */
function renderMarkdown(text: string): React.ReactNode {
  // Split into lines
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line, lineIndex) => {
    let processedLine: React.ReactNode = line;
    
    // Handle headers (### Header)
    if (line.match(/^#{1,3}\s/)) {
      const level = line.match(/^(#{1,3})/)?.[1].length || 1;
      const content = line.replace(/^#{1,3}\s/, '');
      const className = level === 1 ? 'text-lg font-bold' : level === 2 ? 'text-base font-semibold' : 'text-sm font-semibold';
      processedLine = <span key={lineIndex} className={className}>{renderInlineMarkdown(content)}</span>;
    }
    // Handle bullet lists
    else if (line.match(/^\s*[-*]\s/)) {
      const content = line.replace(/^\s*[-*]\s/, '');
      processedLine = (
        <span key={lineIndex} className="flex gap-2">
          <span className="text-slate-400">•</span>
          <span>{renderInlineMarkdown(content)}</span>
        </span>
      );
    }
    // Handle numbered lists
    else if (line.match(/^\s*\d+\.\s/)) {
      const match = line.match(/^(\s*\d+\.)\s(.*)$/);
      if (match) {
        processedLine = (
          <span key={lineIndex} className="flex gap-2">
            <span className="text-slate-500 font-medium min-w-[1.5rem]">{match[1]}</span>
            <span>{renderInlineMarkdown(match[2])}</span>
          </span>
        );
      }
    }
    // Regular line
    else {
      processedLine = <span key={lineIndex}>{renderInlineMarkdown(line)}</span>;
    }
    
    elements.push(
      <div key={lineIndex} className={line === '' ? 'h-2' : ''}>
        {processedLine}
      </div>
    );
  });
  
  return <>{elements}</>;
}

/**
 * Render inline markdown (bold, italic, links)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  // Split text by markdown patterns
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;
  
  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Italic: *text*
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
    // Link: [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    
    // Find the earliest match
    let earliestMatch: { match: RegExpMatchArray; type: 'bold' | 'italic' | 'link' } | null = null;
    
    if (boldMatch && boldMatch.index !== undefined) {
      earliestMatch = { match: boldMatch, type: 'bold' };
    }
    if (italicMatch && italicMatch.index !== undefined) {
      if (!earliestMatch || italicMatch.index < (earliestMatch.match.index || 0)) {
        earliestMatch = { match: italicMatch, type: 'italic' };
      }
    }
    if (linkMatch && linkMatch.index !== undefined) {
      if (!earliestMatch || linkMatch.index < (earliestMatch.match.index || 0)) {
        earliestMatch = { match: linkMatch, type: 'link' };
      }
    }
    
    if (earliestMatch && earliestMatch.match.index !== undefined) {
      // Add text before match
      if (earliestMatch.match.index > 0) {
        parts.push(remaining.substring(0, earliestMatch.match.index));
      }
      
      // Add formatted element
      if (earliestMatch.type === 'bold') {
        parts.push(<strong key={keyIndex++} className="font-semibold">{earliestMatch.match[1]}</strong>);
      } else if (earliestMatch.type === 'italic') {
        parts.push(<em key={keyIndex++} className="italic">{earliestMatch.match[1]}</em>);
      } else if (earliestMatch.type === 'link') {
        parts.push(
          <a 
            key={keyIndex++} 
            href={earliestMatch.match[2]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            {earliestMatch.match[1]}
          </a>
        );
      }
      
      remaining = remaining.substring(earliestMatch.match.index + earliestMatch.match[0].length);
    } else {
      // No more matches, add remaining text
      parts.push(remaining);
      break;
    }
  }
  
  return <>{parts}</>;
}

export function PromptList({ prompts, targetBrand }: PromptListProps) {
  if (prompts.length === 0) {
    return (
      <Card className="border border-slate-200 shadow-sm bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-slate-500" />
            Prompt Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-4">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400 font-medium">No prompts analyzed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mentionedCount = targetBrand
    ? prompts.filter((p) => p.brandsMentioned.includes(targetBrand)).length
    : prompts.filter((p) => p.brandsMentioned.length > 0).length;
  const notMentionedCount = prompts.length - mentionedCount;

  return (
    <Card className="border border-slate-200 shadow-sm bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
      <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 py-4 px-2 sm:px-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-slate-500" />
            <div>
              <h3 className="text-slate-900 dark:text-slate-100">Prompt Analysis</h3>
            </div>
          </CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 flex-1 sm:flex-none justify-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{mentionedCount}</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-1 sm:flex-none justify-center">
              <XCircle className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{notMentionedCount}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full divide-y divide-slate-100 dark:divide-slate-800">
          {prompts.map((prompt, index) => {
            const isMentioned = targetBrand
              ? prompt.brandsMentioned.includes(targetBrand)
              : prompt.brandsMentioned.length > 0;
            const isFirstMention = targetBrand && prompt.firstMention === targetBrand;

            return (
              <AccordionItem 
                key={index} 
                value={`prompt-${index}`}
                className="border-0 px-6 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 group">
                  <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                    {isMentioned ? (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200">
                        <XCircle className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                    )}
                    <span className="truncate font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors text-xs sm:text-sm">
                      {prompt.prompt}
                    </span>
                    {isFirstMention && (
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 flex-shrink-0 rounded-md text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 hidden sm:inline-flex">
                        <Sparkles className="h-3 w-3 mr-0.5 text-indigo-500" />
                        <span className="hidden sm:inline">First Mention</span>
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-6 pl-[2.75rem]">
                  <div className="space-y-4">
                    {/* Brands mentioned with context */}
                    <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        Brands Mentioned
                      </p>
                      {prompt.brandsMentioned.length > 0 ? (
                        <div className="space-y-3">
                          {prompt.brandsMentioned.map((brand) => (
                            <div key={brand} className="space-y-2">
                              <Badge
                                className={
                                  brand === targetBrand
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-0 px-2.5 py-0.5 text-xs rounded-md'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 border-0 px-2.5 py-0.5 text-xs rounded-md'
                                }
                              >
                                {brand}
                                {prompt.firstMention === brand && (
                                  <span className="ml-1.5 text-[10px] opacity-75 font-normal border-l border-white/20 pl-1.5">First Mention</span>
                                )}
                              </Badge>
                              {/* Show context where brand was mentioned */}
                              {prompt.brandContexts?.[brand] && (
                                <div className="ml-1 p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/50 border-l-2 border-indigo-400/50">
                                  <div className="flex items-start gap-2">
                                    <Quote className="h-3 w-3 text-indigo-300 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                      &quot;{prompt.brandContexts[brand]}&quot;
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic pl-2 border-l-2 border-slate-200">
                          No tracked brands were mentioned in this response.
                        </p>
                      )}
                    </div>

                    {/* AI Response with markdown rendering */}
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        AI Response
                      </p>
                      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-h-80 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {renderMarkdown(prompt.response)}
                      </div>
                    </div>

                    {/* URLs if any */}
                    {prompt.urls.length > 0 && (
                      <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                          Sources Cited
                        </p>
                        <ul className="grid grid-cols-1 gap-2">
                          {prompt.urls.map((url, urlIndex) => (
                            <li key={urlIndex}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group/link"
                              >
                                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover/link:text-indigo-600 transition-colors">
                                  <ExternalLink className="h-3 w-3" />
                                </div>
                                <span className="truncate text-xs text-slate-600 dark:text-slate-400 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors">
                                  {url}
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
