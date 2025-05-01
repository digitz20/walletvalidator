"use client";

import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle } from 'lucide-react';
import { wordlist } from '@/lib/bip39-wordlist'; // Import the BIP-39 wordlist

// BIP-39 allows 12, 15, 18, 21, or 24 words.
// Each word must be from the official BIP-39 wordlist.
// We'll validate the number of words and if each word exists in the list.
// Note: This validation does NOT check the checksum, only the format and word validity.

interface ValidationResult {
  phrase: string; // Changed from 'address' to 'phrase'
  isValid: boolean;
  reason?: string; // Optional reason for invalidity
}

// Function to validate a single seed phrase
const validateSeedPhrase = (phrase: string): { isValid: boolean; reason?: string } => {
  const words = phrase.trim().toLowerCase().split(/\s+/);
  const wordCount = words.length;

  // 1. Check for valid word count (12, 15, 18, 21, 24)
  if (![12, 15, 18, 21, 24].includes(wordCount)) {
    return { isValid: false, reason: `Invalid word count (${wordCount}). Must be 12, 15, 18, 21, or 24.` };
  }

  // 2. Check if all words are in the BIP-39 English wordlist
  const invalidWords = words.filter(word => !wordlist.has(word));
  if (invalidWords.length > 0) {
    return { isValid: false, reason: `Invalid words found: ${invalidWords.join(', ')}.` };
  }

  // 3. Placeholder for future checksum validation (optional, complex)
  // For now, if word count and words are valid, consider the format valid.
  // const isValidChecksum = bip39.validateMnemonic(phrase); // Requires a library like 'bip39'
  // if (!isValidChecksum) {
  //   return { isValid: false, reason: 'Invalid checksum.' };
  // }

  return { isValid: true };
};

export default function Home() {
  const [seedInput, setSeedInput] = useState<string>(''); // Renamed state
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const handleValidate = () => {
    setIsValidating(true);
    // Split by newline, assuming one phrase per line for simplicity
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
            <CardTitle className="text-3xl font-bold text-foreground">Seed Phrase Validator</CardTitle> {/* Updated Title */}
            <CardDescription className="text-muted-foreground">
              Enter or paste BIP-39 seed phrases below (one phrase per line).
            </CardDescription> {/* Updated Description */}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste seed phrases here, one per line..." // Updated Placeholder
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                rows={8}
                className="text-sm resize-none bg-card border-input focus:ring-primary font-mono" // Use text-sm and font-mono
                aria-label="Seed Phrases Input"
              />
              <Button
                onClick={handleValidate}
                disabled={!seedInput || isValidating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                aria-live="polite"
              >
                {isValidating ? 'Validating...' : 'Validate Phrases'} {/* Updated Button Text */}
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
                          <CheckCircle2 className="h-5 w-5" /> Valid Phrases ({validPhrases.length}) {/* Updated Text */}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <ul className="space-y-2 list-none text-sm text-foreground break-words"> {/* Increased space-y */}
                          {validPhrases.map((result, index) => (
                            <li key={`valid-${index}`} className="flex items-start gap-2 font-mono"> {/* Use items-start */}
                               <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> {/* Add margin-top */}
                               {/* Display first few and last few words for brevity */}
                               <span className="flex-1">
                                {result.phrase.split(' ').slice(0, 3).join(' ')} ... {result.phrase.split(' ').slice(-3).join(' ')}
                               </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {invalidPhrases.length > 0 && (
                     <Card className="border-destructive">
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                          <XCircle className="h-5 w-5" /> Invalid Phrases ({invalidPhrases.length}) {/* Updated Text */}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <ul className="space-y-2 list-none text-sm text-foreground break-words"> {/* Increased space-y */}
                          {invalidPhrases.map((result, index) => (
                             <li key={`invalid-${index}`} className="flex items-start gap-2 font-mono"> {/* Use items-start */}
                               <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" /> {/* Add margin-top */}
                               <div className="flex-1">
                                  {/* Display first few and last few words for brevity */}
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
