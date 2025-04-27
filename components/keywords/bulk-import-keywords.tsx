'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { bulkAddKeywords } from '@/store/slices/keywords-slice';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileUpIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BulkImportKeywordsProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportKeywords({
  projectId,
  open,
  onOpenChange,
}: BulkImportKeywordsProps) {
  const [keywordsText, setKeywordsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setKeywordsText(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keywordsText.trim()) {
      toast({
        title: 'No keywords provided',
        description: 'Please enter at least one keyword to add.',
        variant: 'destructive',
      });
      return;
    }

    // Parse keywords - split by newline, comma, or semicolon and clean up
    const keywords = keywordsText
      .split(/[\n,;]/)
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);

    if (keywords.length === 0) {
      toast({
        title: 'No valid keywords found',
        description: 'Please enter at least one valid keyword.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await dispatch(
        bulkAddKeywords({
          projectId,
          keywords,
        })
      ).unwrap();

      toast({
        title: 'Keywords Added',
        description: `Added ${result.length} keywords to your tracking list.`,
      });
      
      // Reset and close dialog
      setKeywordsText('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add keywords',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Keywords</DialogTitle>
          <DialogDescription>
            Add multiple keywords at once by entering them below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Formatting Instructions</AlertTitle>
              <AlertDescription>
                Enter each keyword on a new line, or separate them with commas or semicolons.
              </AlertDescription>
            </Alert>

            <Textarea
              placeholder="digital marketing agency
seo services
website optimization
content strategy
..."
              className="h-64 font-mono"
              value={keywordsText}
              onChange={handleTextChange}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !keywordsText.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileUpIcon className="mr-2 h-4 w-4" />
                  Import Keywords
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}