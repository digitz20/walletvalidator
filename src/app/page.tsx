"use client";

import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { validateMnemonic } from 'bip39'; // Import bip39 function
import { wordlist } from '@/lib/bip39-wordlist'; // Keep wordlist for individual word check

// BIP-39 allows 12, 15, 18, 21, or 24 words.
// Each word must be from the official BIP-39 wordlist.
// We'll validate the number of words, if each word exists in the list,
// and the BIP-39 checksum.

interface ValidationResult {
  phrase: string;
  isValid: boolean;
  reason?: string; // Optional reason for invalidity
}

// Function to validate a single seed phrase
const validateSeedPhrase = (phrase: string): { isValid: boolean; reason?: string } => {
  const trimmedPhrase = phrase.trim().toLowerCase();
  const words = trimmedPhrase.split(/\s+/);
  const wordCount = words.length;

  // 1. Check for valid word count (12, 15, 18, 21, 24)
  if (![12, 15, 18, 21, 24].includes(wordCount)) {
    return { isValid: false, reason: `Invalid word count (${wordCount}). Must be 12, 15, 18, 21, or 24.` };
  }

  // 2. Check if all words are in the BIP-39 English wordlist (optional but good pre-check)
  const invalidWords = words.filter(word => !wordlist.has(word));
  if (invalidWords.length > 0) {
    return { isValid: false, reason: `Invalid words found: ${invalidWords.join(', ')}.` };
  }

  // 3. Validate the mnemonic using the bip39 library (includes checksum validation)
  const isValidMnemonic = validateMnemonic(trimmedPhrase);
  if (!isValidMnemonic) {
    // Checksum is likely the issue if word count and individual words are okay
    return { isValid: false, reason: 'Invalid BIP-39 checksum or phrase structure.' };
  }

  // If all checks pass
  return { isValid: true };
};

export default function Home() {
  const [seedInput, setSeedInput] = useState<string>('');
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const handleValidate = () => {
    setIsValidating(true);
    // Split by newline, assuming one phrase per line
    // Trim each line and filter out empty ones
    const phrases = seedInput
      .split('\n')
      .map(phrase => phrase.trim())
      .filter(phrase => phrase.length > 0);

    const validationResults = phrases.map(phrase => {
      const validation = validateSeedPhrase(phrase);
      return {
        phrase,
        isValid: validation.isValid,
        reason: validation.reason,
      };
    });

    setResults(validationResults);
    setIsValidating(false);
  };

  const validPhrases = results.filter(r => r.isValid);
  const invalidPhrases = results.filter(r => !r.isValid);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-foreground">Seed Phrase Validator</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter BIP-39 seed phrases (one per line). Validates word count, word list, and checksum.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste seed phrases here, one per line..."
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                rows={8}
                className="text-sm resize-none bg-card border-input focus:ring-primary font-mono"
                aria-label="Seed Phrases Input"
              />
              <Button
                onClick={handleValidate}
                disabled={!seedInput || isValidating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                aria-live="polite"
              >
                {isValidating ? 'Validating...' : 'Validate Phrases'}
              </Button>
            </div>

            {results.length > 0 && (
              <div className="mt-8 space-y-6">
                <Separator />
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Validation Results</h3>
                  {validPhrases.length > 0 && (
                     <Card className="mb-4 border-green-500">
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="h-5 w-5" /> Valid BIP-39 Phrases ({validPhrases.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        <ul className="space-y-2 list-none text-sm text-foreground break-words">
                          {validPhrases.map((result, index) => (
                            <li key={`valid-${index}`} className="flex items-start gap-2 font-mono">
                               <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                               <span className="flex-1">
                                {result.phrase.split(' ').slice(0, 3).join(' ')} ... {result.phrase.split(' ').slice(-3).join(' ')}
                               </span>
                            </li>
                          ))}
                        </ul>
                         <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-md border border-input">
                           <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                           <span>
                             A valid BIP-39 seed phrase is a standard recovery method. It doesn't inherently belong to a single cryptocurrency (like Bitcoin or Ethereum). It can be used with various wallets and derivation paths to access different accounts. This tool only validates the format, not its association with any specific wallet or coin.
                           </span>
                         </div>
                      </CardContent>
                    </Card>
                  )}
                  {invalidPhrases.length > 0 && (
                     <Card className="border-destructive">
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                          <XCircle className="h-5 w-5" /> Invalid Phrases ({invalidPhrases.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <ul className="space-y-2 list-none text-sm text-foreground break-words">
                          {invalidPhrases.map((result, index) => (
                             <li key={`invalid-${index}`} className="flex items-start gap-2 font-mono">
                               <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                               <div className="flex-1">
                                  <span>
                                    {result.phrase.split(' ').slice(0, 3).join(' ')} ... {result.phrase.split(' ').slice(-3).join(' ')}
                                  </span>
                                  {result.reason && <p className="text-xs text-muted-foreground mt-1">{result.reason}</p>}
                               </div>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
