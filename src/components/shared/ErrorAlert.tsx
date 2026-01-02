'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, XCircle } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  variant?: 'default' | 'destructive';
}

export function ErrorAlert({ title = 'Error', message, variant = 'destructive' }: ErrorAlertProps) {
  return (
    <Alert variant={variant}>
      {variant === 'destructive' ? (
        <XCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
