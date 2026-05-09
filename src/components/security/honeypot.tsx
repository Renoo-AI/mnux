'use client';

import { Input } from '@/components/ui/input';

interface HoneypotInputProps {
  name?: string;
}

/**
 * Honeypot input component for bot detection
 * This field is hidden from users but visible to bots
 * If filled, the submission is likely from a bot
 */
export function HoneypotInput({ name = 'website' }: HoneypotInputProps) {
  return (
    <div className="absolute -left-[9999px] w-1 h-1 overflow-hidden" aria-hidden="true">
      <Input
        type="text"
        name={name}
        tabIndex={-1}
        autoComplete="off"
        className="w-1 h-1 opacity-0 pointer-events-none"
        aria-label="Leave this field empty"
      />
      {/* Additional honeypot fields for extra protection */}
      <Input
        type="text"
        name="honeypot"
        tabIndex={-1}
        autoComplete="off"
        className="w-1 h-1 opacity-0 pointer-events-none"
      />
      <Input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        className="w-1 h-1 opacity-0 pointer-events-none"
      />
    </div>
  );
}

/**
 * Form wrapper with honeypot protection
 */
export function HoneypotProtectedForm({ 
  children,
  onSubmit,
  ...props 
}: {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, isBot: boolean) => void;
} & React.FormHTMLAttributes<HTMLFormElement>) {
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    
    // Check honeypot fields
    const honeypotFields = ['website', 'honeypot', '_gotcha'];
    const isBot = honeypotFields.some(fieldName => {
      const field = form.querySelector(`input[name="${fieldName}"]`) as HTMLInputElement;
      return field && field.value !== '';
    });
    
    if (isBot) {
      // Silently "accept" the submission but don't process it
      console.log('Bot detected via honeypot');
      e.preventDefault();
      return;
    }
    
    onSubmit(e, false);
  };
  
  return (
    <form onSubmit={handleSubmit} {...props}>
      <HoneypotInput />
      {children}
    </form>
  );
}

/**
 * Time-based form token for additional protection
 */
export function FormToken({ 
  minTimeMs = 2000 
}: { 
  minTimeMs?: number 
}) {
  const timestamp = Date.now();
  
  return (
    <>
      <input type="hidden" name="_form_timestamp" value={timestamp} />
      <input type="hidden" name="_min_time" value={minTimeMs} />
    </>
  );
}

/**
 * Check if form was submitted too quickly (bot indicator)
 */
export function checkFormTiming(
  formData: FormData | { get: (key: string) => string | null }
): { isValid: boolean; submittedTooFast: boolean } {
  const timestamp = formData.get('_form_timestamp');
  const minTime = formData.get('_min_time');
  
  if (!timestamp || !minTime) {
    return { isValid: true, submittedTooFast: false };
  }

  // Type check: FormDataEntryValue can be File or string, we need string
  if (typeof timestamp !== 'string' || typeof minTime !== 'string') {
    return { isValid: true, submittedTooFast: false };
  }

  const elapsed = Date.now() - parseInt(timestamp, 10);
  const minimum = parseInt(minTime, 10);
  
  return {
    isValid: elapsed >= minimum,
    submittedTooFast: elapsed < minimum,
  };
}
