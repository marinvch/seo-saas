'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  selectAllKeywords,
  selectKeywordsLoading,
  deleteKeyword,
  updateKeyword
} from '@/store/slices/keywords-slice';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ChevronDown, 
  Loader2, 
  MoreVertical, 
  Pencil, 
  Trash2,
  ArrowUpDown,
  Search
} from 'lucide-react';

interface KeywordsTableProps {
  projectId: string;
}

const formSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  volume: z.coerce.number().int().nonnegative().optional(),
  difficulty: z.coerce.number().min(0).max(100).optional(),
  cpc: z.coerce.number().min(0).optional(),
  intent: z.enum(['informational', 'navigational', 'transactional', 'commercial']).optional(),
});

type FormData = z.infer<typeof formSchema>;

export function KeywordsTable({ projectId }: KeywordsTableProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const keywords = useAppSelector(selectAllKeywords);
  const isLoading = useAppSelector(selectKeywordsLoading);

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('keyword');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // State for keyword editing
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keywordToDelete, setKeywordToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: '',
      volume: undefined,
      difficulty: undefined,
      cpc: undefined,
      intent: undefined,
    },
  });

  // Apply filters and sorting
  const filteredAndSortedKeywords = [...keywords]
    .filter((keyword) => {
      if (!searchTerm) return true;
      return keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const key = sortBy as keyof typeof a;
      
      // Handle undefined values
      if (a[key] === undefined && b[key] === undefined) return 0;
      if (a[key] === undefined) return sortOrder === 'asc' ? -1 : 1;
      if (b[key] === undefined) return sortOrder === 'asc' ? 1 : -1;
      
      // Handle string comparison
      if (typeof a[key] === 'string' && typeof b[key] === 'string') {
        return sortOrder === 'asc'
          ? (a[key] as string).localeCompare(b[key] as string)
          : (b[key] as string).localeCompare(a[key] as string);
      }
      
      // Handle numeric comparison
      return sortOrder === 'asc' 
        ? Number(a[key]) - Number(b[key])
        : Number(b[key]) - Number(a[key]);
    });

  // Handlers for sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handler for opening edit dialog
  const handleEdit = (keyword: any) => {
    setEditingKeyword(keyword.id);
    form.reset({
      keyword: keyword.keyword,
      volume: keyword.volume,
      difficulty: keyword.difficulty,
      cpc: keyword.cpc,
      intent: keyword.intent,
    });
    setEditDialogOpen(true);
  };

  // Handler for opening delete dialog
  const handleDeleteClick = (keywordId: string) => {
    setKeywordToDelete(keywordId);
    setDeleteDialogOpen(true);
  };

  // Handler for submitting edit form
  const onSubmit = async (data: FormData) => {
    if (!editingKeyword) return;
    
    setIsSubmitting(true);

    try {
      await dispatch(updateKeyword({
        projectId,
        keywordId: editingKeyword,
        updates: {
          keyword: data.keyword.trim(),
          volume: data.volume,
          difficulty: data.difficulty,
          cpc: data.cpc,
          intent: data.intent,
        },
      })).unwrap();

      toast({
        title: 'Keyword Updated',
        description: 'Keyword has been updated successfully.',
      });
      
      setEditDialogOpen(false);
      setEditingKeyword(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update keyword',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for confirming delete
  const handleDeleteConfirm = async () => {
    if (!keywordToDelete) return;
    
    setIsSubmitting(true);

    try {
      await dispatch(deleteKeyword({
        projectId,
        keywordId: keywordToDelete,
      })).unwrap();

      toast({
        title: 'Keyword Deleted',
        description: 'Keyword has been deleted successfully.',
      });
      
      setDeleteDialogOpen(false);
      setKeywordToDelete(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete keyword',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keywords..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredAndSortedKeywords.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('keyword')}
                >
                  <div className="flex items-center">
                    Keyword 
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort('volume')}
                >
                  <div className="flex items-center justify-end">
                    Volume 
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort('difficulty')}
                >
                  <div className="flex items-center justify-end">
                    Difficulty 
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-center"
                  onClick={() => handleSort('intent')}
                >
                  <div className="flex items-center justify-center">
                    Intent 
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort('cpc')}
                >
                  <div className="flex items-center justify-end">
                    CPC
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedKeywords.map((keyword) => (
                <TableRow key={keyword.id}>
                  <TableCell className="font-medium">{keyword.keyword}</TableCell>
                  <TableCell className="text-right">
                    {keyword.volume ? keyword.volume.toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {keyword.difficulty !== null && keyword.difficulty !== undefined
                      ? `${keyword.difficulty.toFixed(1)}`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    {keyword.intent ? (
                      <Badge variant={getIntentBadgeVariant(keyword.intent)}>
                        {keyword.intent.charAt(0).toUpperCase() + keyword.intent.slice(1)}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {keyword.cpc ? `$${keyword.cpc.toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleEdit(keyword)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-destructive"
                          onClick={() => handleDeleteClick(keyword.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground">
            {searchTerm ? 'No keywords match your search.' : 'No keywords have been added yet.'}
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Keyword</DialogTitle>
            <DialogDescription>
              Update keyword details.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keyword</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Volume</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty (0-100)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPC ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="intent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search Intent</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select intent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="informational">Informational</SelectItem>
                          <SelectItem value="navigational">Navigational</SelectItem>
                          <SelectItem value="transactional">Transactional</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Keyword'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this keyword? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}