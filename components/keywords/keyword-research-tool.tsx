'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { researchKeywords, bulkAddKeywords } from '@/store/slices/keywords-slice';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, SearchIcon, PlusIcon, InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface KeywordResearchToolProps {
  projectId: string;
}

interface KeywordSuggestion {
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
  selected: boolean;
}

export function KeywordResearchTool({ projectId }: KeywordResearchToolProps) {
  const [seedKeyword, setSeedKeyword] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [isAddingSelected, setIsAddingSelected] = useState(false);
  const [searchEngine, setSearchEngine] = useState('google');
  const [country, setCountry] = useState('us');
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!seedKeyword.trim()) {
      toast({
        title: 'Keyword Required',
        description: 'Please enter a seed keyword to research.',
        variant: 'destructive',
      });
      return;
    }

    setIsResearching(true);

    try {
      const result = await dispatch(
        researchKeywords({
          projectId,
          seed: seedKeyword.trim(),
          searchEngine,
          country,
        })
      ).unwrap();

      // Transform API response to our state format with selected flag
      const keywordSuggestions = result.map((kw: any) => ({
        ...kw,
        selected: false,
      }));

      setSuggestions(keywordSuggestions);
      setSelectAll(false);
      
      if (keywordSuggestions.length === 0) {
        toast({
          title: 'No Suggestions Found',
          description: 'Try a different seed keyword or search parameters.',
        });
      }
    } catch (error) {
      toast({
        title: 'Research Failed',
        description: error instanceof Error ? error.message : 'Failed to research keywords',
        variant: 'destructive',
      });
    } finally {
      setIsResearching(false);
    }
  };

  const handleCheckboxChange = (index: number) => {
    const updatedSuggestions = [...suggestions];
    updatedSuggestions[index].selected = !updatedSuggestions[index].selected;
    setSuggestions(updatedSuggestions);
    
    // Update selectAll state based on whether all items are now selected
    setSelectAll(updatedSuggestions.every(suggestion => suggestion.selected));
  };

  const handleSelectAllChange = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    // Update all suggestion items
    const updatedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      selected: newSelectAll,
    }));
    
    setSuggestions(updatedSuggestions);
  };

  const handleAddSelected = async () => {
    const selectedKeywords = suggestions
      .filter(suggestion => suggestion.selected)
      .map(suggestion => ({
        keyword: suggestion.keyword,
        volume: suggestion.volume,
        difficulty: suggestion.difficulty,
        cpc: suggestion.cpc,
        intent: suggestion.intent,
      }));

    if (selectedKeywords.length === 0) {
      toast({
        title: 'No Keywords Selected',
        description: 'Please select at least one keyword to add.',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingSelected(true);

    try {
      await dispatch(
        bulkAddKeywords({
          projectId,
          keywords: selectedKeywords,
        })
      ).unwrap();

      toast({
        title: 'Keywords Added',
        description: `Added ${selectedKeywords.length} keywords to your tracking list.`,
      });
      
      // Mark added keywords as unselected
      const updatedSuggestions = suggestions.map(suggestion => 
        suggestion.selected ? { ...suggestion, selected: false } : suggestion
      );
      
      setSuggestions(updatedSuggestions);
      setSelectAll(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add keywords',
        variant: 'destructive',
      });
    } finally {
      setIsAddingSelected(false);
    }
  };

  // Get intent badge variant based on intent type
  const getIntentBadgeVariant = (intent?: string) => {
    if (!intent) return 'secondary';
    
    switch (intent.toLowerCase()) {
      case 'informational':
        return 'secondary';
      case 'navigational':
        return 'outline';
      case 'transactional':
        return 'default';
      case 'commercial':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword Research Tool</CardTitle>
        <CardDescription>
          Find related keywords by entering a seed keyword
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div className="flex-1">
              <Label htmlFor="seedKeyword">Seed Keyword</Label>
              <Input
                id="seedKeyword"
                placeholder="Enter a keyword..."
                value={seedKeyword}
                onChange={(e) => setSeedKeyword(e.target.value)}
                disabled={isResearching}
              />
            </div>
            
            <div className="w-full md:w-[150px]">
              <Label htmlFor="searchEngine">Search Engine</Label>
              <Select
                value={searchEngine}
                onValueChange={setSearchEngine}
                disabled={isResearching}
              >
                <SelectTrigger id="searchEngine">
                  <SelectValue placeholder="Search Engine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="bing">Bing</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-[150px]">
              <Label htmlFor="country">Country</Label>
              <Select
                value={country}
                onValueChange={setCountry}
                disabled={isResearching}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="ca">Canada</SelectItem>
                  <SelectItem value="au">Australia</SelectItem>
                  <SelectItem value="in">India</SelectItem>
                  <SelectItem value="de">Germany</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="self-end">
              <Button type="submit" disabled={isResearching || !seedKeyword.trim()}>
                {isResearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Research
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {suggestions.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Keyword Suggestions ({suggestions.length})</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectAll}
                    onCheckedChange={handleSelectAllChange}
                  />
                  <Label htmlFor="selectAll">Select All</Label>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddSelected}
                  disabled={isAddingSelected || !suggestions.some(s => s.selected)}
                >
                  {isAddingSelected ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="mr-2 h-3 w-3" />
                      Add Selected
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Keyword</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end">
                        Volume
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="ml-1 h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Estimated monthly search volume
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end">
                        Difficulty
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="ml-1 h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              SEO difficulty score (0-100)
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Intent</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end">
                        CPC
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="ml-1 h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Cost per click (USD)
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((suggestion, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={suggestion.selected}
                          onCheckedChange={() => handleCheckboxChange(index)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{suggestion.keyword}</TableCell>
                      <TableCell className="text-right">
                        {suggestion.volume ? suggestion.volume.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {suggestion.difficulty !== null && suggestion.difficulty !== undefined
                          ? `${suggestion.difficulty.toFixed(1)}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {suggestion.intent ? (
                          <Badge variant={getIntentBadgeVariant(suggestion.intent)}>
                            {suggestion.intent.charAt(0).toUpperCase() + suggestion.intent.slice(1)}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {suggestion.cpc ? `$${suggestion.cpc.toFixed(2)}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function KeywordResearchToolWithError(props: { projectId: string }) {
  return (
    <ErrorBoundary>
      <KeywordResearchTool {...props} />
    </ErrorBoundary>
  );
}