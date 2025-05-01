
"use client";

import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Info, Shuffle, Trash2, Eraser, Copy, CopyCheck, Files, ListChecks } from 'lucide-react'; // Added ListChecks icon
import { validateMnemonic, generateMnemonic } from 'bip39';
import { wordlist } from '@/lib/bip39-wordlist';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// BIP-39 allows 12, 15, 18, 21, or 24 words.
// Each word must be from the official BIP-39 wordlist.
// We'll validate the number of words, if each word exists in the list,
// and the BIP-39 checksum.

interface ValidationResult {
  phrase: string;
  isValid: boolean;
  reason?: string; // Optional reason for invalidity
}

type WordCount = 12 | 15 | 18 | 21 | 24;

// Function to validate a single seed phrase
const validateSeedPhrase = (phrase: string): { isValid: boolean; reason?: string } => {
  const trimmedPhrase = phrase.trim().toLowerCase();
  // Normalize spaces: replace multiple spaces/newlines with a single space
  const normalizedPhrase = trimmedPhrase.replace(/\s+/g, ' ');
  const words = normalizedPhrase.split(' ');
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
  // Use the normalized phrase for validation
  const isValidMnemonic = validateMnemonic(normalizedPhrase);
  if (!isValidMnemonic) {
    // Checksum is likely the issue if word count and individual words are okay
    return { isValid: false, reason: 'Invalid BIP-39 checksum or phrase structure.' };
  }

  // If all checks pass
  return { isValid: true };
};

// Function to map word count to BIP-39 strength (entropy bits)
const getStrengthForWordCount = (wordCount: WordCount): number => {
  switch (wordCount) {
    case 12: return 128;
    case 15: return 160;
    case 18: return 192;
    case 21: return 224;
    case 24: return 256;
    default: return 128; // Default to 12 words (128 bits)
  }
};

const MAX_BULK_GENERATE = 1000; // Limit bulk generation for performance

export default function Home() {
  const [seedInput, setSeedInput] = useState<string>('');
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [bulkCount, setBulkCount] = useState<number>(10); // Default bulk count
  const [bulkWordCount, setBulkWordCount] = useState<WordCount>(12); // Default word count for bulk
  const [bulkGeneratedPhrases, setBulkGeneratedPhrases] = useState<string[]>([]);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null); // Track which bulk phrase is copied
  const { toast } = useToast(); // Toast hook

  const handleValidate = () => {
    setIsValidating(true);
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

  const handleGenerateRandom = (wordCount: WordCount) => {
    const strength = getStrengthForWordCount(wordCount);
    const mnemonic = generateMnemonic(strength);
    setSeedInput(prev => prev ? `${prev}\n${mnemonic}` : mnemonic);
  };

  const handleClearInput = () => {
    setSeedInput('');
  };

  const handleClearResults = () => {
    setResults([]);
  };

  const handleGenerateBulk = () => {
      if (bulkCount <= 0 || bulkCount > MAX_BULK_GENERATE) {
          toast({
              title: "Invalid Quantity",
              description: `Please enter a number between 1 and ${MAX_BULK_GENERATE}. Generating extremely large numbers of phrases can impact browser performance.`,
              variant: "destructive",
          });
          return;
      }

      setIsGeneratingBulk(true);
      setBulkGeneratedPhrases([]); // Clear previous bulk results
      setCopiedIndex(null); // Reset copied state when generating new ones

      // Generate phrases
      const generated: string[] = [];
      const strength = getStrengthForWordCount(bulkWordCount);
      try {
          for (let i = 0; i < bulkCount; i++) {
              generated.push(generateMnemonic(strength));
          }
          setBulkGeneratedPhrases(generated);
          toast({
              title: "Bulk Generation Complete",
              description: `${generated.length} phrases generated.`,
          });
      } catch (error) {
          console.error("Bulk generation error:", error);
          toast({
              title: "Generation Error",
              description: "Could not generate phrases. Please try again.",
              variant: "destructive",
          });
      } finally {
          setIsGeneratingBulk(false);
      }
  };

  const handleClearBulkResults = () => {
    setBulkGeneratedPhrases([]);
    setCopiedIndex(null); // Reset copied state
  };

  const handleCopyPhrase = (phrase: string, index: number) => {
    navigator.clipboard.writeText(phrase).then(() => {
      setCopiedIndex(index);
      toast({ title: "Copied!", description: "Seed phrase copied to clipboard." });
      setTimeout(() => setCopiedIndex(null), 2000); // Reset icon after 2 seconds
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({ title: "Error", description: "Failed to copy phrase.", variant: "destructive" });
    });
  };

    const handleCopyAllBulk = () => {
        const allPhrases = bulkGeneratedPhrases.join('\n');
        if (!allPhrases) return;

        navigator.clipboard.writeText(allPhrases).then(() => {
            toast({ title: "Copied All!", description: `${bulkGeneratedPhrases.length} phrases copied to clipboard.` });
        }).catch(err => {
            console.error('Failed to copy all text: ', err);
            toast({ title: "Error", description: "Failed to copy all phrases.", variant: "destructive" });
        });
    };

  const handleValidateBulk = () => {
        if (bulkGeneratedPhrases.length === 0) {
            toast({
                title: "No Phrases to Validate",
                description: "Generate some phrases first.",
                variant: "default",
            });
            return;
        }

        setIsValidating(true); // Use the same loading state or create a new one if needed
        const validationResults = bulkGeneratedPhrases.map(phrase => {
          const validation = validateSeedPhrase(phrase);
          return {
            phrase,
            isValid: validation.isValid,
            reason: validation.reason,
          };
        });

        setResults(validationResults); // Update the main results display
        setIsValidating(false);
        toast({
            title: "Bulk Validation Complete",
            description: `${validationResults.length} phrases validated. Results shown below.`,
        });
        // Optionally scroll to results section
         document.getElementById('validation-results-section')?.scrollIntoView({ behavior: 'smooth' });
    };


  const validPhrases = results.filter(r => r.isValid);
  const invalidPhrases = results.filter(r => !r.isValid);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-3xl space-y-8">
        {/* Validation Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-foreground">BIP-39 Seed Phrase Validator</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter BIP-39 seed phrases (one per line) to validate format, word list, and checksum. You can also generate random phrases.
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
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                 <Button
                    onClick={handleValidate}
                    disabled={!seedInput || isValidating}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    aria-live="polite"
                  >
                    {isValidating ? 'Validating...' : 'Validate Phrases'}
                  </Button>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        <Shuffle className="mr-2 h-4 w-4" /> Generate
                      </Button>
                    </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-[200px]">
                        {[12, 15, 18, 21, 24].map((count) => (
                          <DropdownMenuItem key={count} onSelect={() => handleGenerateRandom(count as WordCount)}>
                            Generate {count} words
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    onClick={handleClearInput}
                    disabled={!seedInput}
                    variant="outline"
                    className="w-full"
                    aria-label="Clear Input Field"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Clear Input
                  </Button>
                  <Button
                      onClick={handleClearResults}
                      disabled={results.length === 0} // Disable if no results
                      variant="outline"
                      className="w-full"
                      aria-label="Clear Validation Results"
                    >
                      <Eraser className="mr-2 h-4 w-4" /> Clear Results
                    </Button>
               </div>
            </div>

            {results.length > 0 && (
              <div id="validation-results-section" className="mt-8 space-y-6">
                <Separator />
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Validation Results</h3>
                  {/* Valid Phrases */}
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
                                {result.phrase.split(' ').slice(0, 3).join(' ')} ... {result.phrase.split(' ').slice(-3).join(' ')} ({result.phrase.split(' ').length} words)
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
                   {/* Invalid Phrases */}
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
                                    {result.phrase.split(' ').slice(0, 3).join(' ')} ... {result.phrase.split(' ').slice(-3).join(' ')} ({result.phrase.split(' ').length} words)
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

        {/* Bulk Generation Card */}
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground">Bulk Generate BIP-39 Phrases</CardTitle>
                <CardDescription className="text-muted-foreground">
                   Generate multiple seed phrases at once. Max {MAX_BULK_GENERATE} for performance.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="bulk-count">Quantity (1-{MAX_BULK_GENERATE})</Label>
                            <Input
                                id="bulk-count"
                                type="number"
                                min="1"
                                max={MAX_BULK_GENERATE}
                                value={bulkCount}
                                onChange={(e) => setBulkCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="bg-card border-input focus:ring-primary"
                            />
                        </div>
                         <div className="flex-1 space-y-1">
                             <Label htmlFor="bulk-word-count">Word Count</Label>
                             <Select
                                value={bulkWordCount.toString()}
                                onValueChange={(value) => setBulkWordCount(parseInt(value) as WordCount)}
                              >
                                <SelectTrigger id="bulk-word-count" className="w-full bg-card border-input focus:ring-primary">
                                    <SelectValue placeholder="Select word count" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="12">12 Words</SelectItem>
                                    <SelectItem value="15">15 Words</SelectItem>
                                    <SelectItem value="18">18 Words</SelectItem>
                                    <SelectItem value="21">21 Words</SelectItem>
                                    <SelectItem value="24">24 Words</SelectItem>
                                </SelectContent>
                              </Select>
                         </div>
                         <Button
                            onClick={handleGenerateBulk}
                            disabled={isGeneratingBulk}
                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {isGeneratingBulk ? 'Generating...' : 'Generate Bulk'}
                          </Button>
                    </div>

                    {bulkGeneratedPhrases.length > 0 && (
                        <div className="mt-6 space-y-4">
                            <Separator />
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-foreground">Generated Phrases ({bulkGeneratedPhrases.length})</h3>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleValidateBulk}
                                        variant="outline"
                                        size="sm"
                                        disabled={isValidating} // Disable while validating
                                        aria-label="Validate Bulk Generated Phrases"
                                    >
                                        <ListChecks className="mr-2 h-4 w-4" /> Validate Bulk
                                    </Button>
                                    <Button
                                        onClick={handleCopyAllBulk}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Files className="mr-2 h-4 w-4" /> Copy All
                                    </Button>
                                    <Button
                                        onClick={handleClearBulkResults}
                                        variant="outline"
                                        size="sm"
                                        aria-label="Clear Bulk Generation Results"
                                    >
                                        <Eraser className="mr-2 h-4 w-4" /> Clear Bulk
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="h-60 w-full rounded-md border p-4 bg-muted/20">
                                <ul className="space-y-2 font-mono text-sm">
                                    {bulkGeneratedPhrases.map((phrase, index) => (
                                        <li key={index} className="flex items-center justify-between gap-2 p-1 hover:bg-muted/50 rounded">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 flex-shrink-0"
                                                onClick={() => handleCopyPhrase(phrase, index)}
                                                aria-label={`Copy phrase ${index + 1}`}
                                            >
                                                {copiedIndex === index ? (
                                                  <CopyCheck className="h-4 w-4 text-green-500" />
                                                ) : (
                                                  <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <span className="flex-1 truncate">{phrase}</span>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>

      </div>
    </main>
  );
}

