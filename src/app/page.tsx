"use client";

import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle } from 'lucide-react';

// Regex pattern for valid Bitcoin wallet addresses (P2PKH, P2SH, Bech32)
const BITCOIN_REGEX = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|^(tb1|[mn2])[a-zA-HJ-NP-Z0-9]{25,39}$/;
// Basic Ethereum address check (0x followed by 40 hex characters)
const ETHEREUM_REGEX = /^0x[a-fA-F0-9]{40}$/;

// Combine regex for broader validation if needed, or keep separate
// For this example, we'll check against both Bitcoin and Ethereum formats
// A more robust solution might involve libraries or specific checks per address type
const WALLET_REGEX = new RegExp(`(${BITCOIN_REGEX.source})|(${ETHEREUM_REGEX.source})`);

interface ValidationResult {
  address: string;
  isValid: boolean;
}

export default function Home() {
  const [walletInput, setWalletInput] = useState<string>('');
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const handleValidate = () => {
    setIsValidating(true);
    // Split by newline, space, or comma, and filter out empty strings
    const addresses = walletInput
      .split(/[\n\s,]+/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    const validationResults = addresses.map(address => ({
      address,
      isValid: WALLET_REGEX.test(address),
    }));

    setResults(validationResults);
    setIsValidating(false);
  };

  const validAddresses = results.filter(r => r.isValid);
  const invalidAddresses = results.filter(r => !r.isValid);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-foreground">Wallet Validator</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter or paste wallet addresses below (one per line, or separated by space/comma).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste wallet addresses here..."
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                rows={8}
                className="text-base resize-none bg-card border-input focus:ring-primary"
                aria-label="Wallet Addresses Input"
              />
              <Button
                onClick={handleValidate}
                disabled={!walletInput || isValidating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                aria-live="polite"
              >
                {isValidating ? 'Validating...' : 'Validate Addresses'}
              </Button>
            </div>

            {results.length > 0 && (
              <div className="mt-8 space-y-6">
                <Separator />
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Validation Results</h3>
                  {validAddresses.length > 0 && (
                     <Card className="mb-4 border-green-500">
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="h-5 w-5" /> Valid Addresses ({validAddresses.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <ul className="space-y-1 list-none text-sm text-foreground break-words">
                          {validAddresses.map((result, index) => (
                            <li key={`valid-${index}`} className="flex items-center gap-2">
                               <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                               <span>{result.address}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {invalidAddresses.length > 0 && (
                     <Card className="border-destructive">
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                          <XCircle className="h-5 w-5" /> Invalid Addresses ({invalidAddresses.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <ul className="space-y-1 list-none text-sm text-foreground break-words">
                          {invalidAddresses.map((result, index) => (
                             <li key={`invalid-${index}`} className="flex items-center gap-2">
                               <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                               <span>{result.address}</span>
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
