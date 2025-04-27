'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectAllKeywords } from '@/store/slices/keywords-slice';
import { Card, CardContent } from '@/components/ui/card';
import { Tag, BarChart2, TrendingUp, AlertCircle } from 'lucide-react';

interface KeywordDataSummaryProps {
  projectId: string;
}

export function KeywordDataSummary({ projectId }: KeywordDataSummaryProps) {
  const keywords = useAppSelector(selectAllKeywords);
  const [metrics, setMetrics] = useState({
    totalKeywords: 0,
    avgDifficulty: 0,
    topIntents: [] as { intent: string; count: number }[],
    topRanked: 0,
  });

  useEffect(() => {
    if (keywords.length > 0) {
      // Calculate total keywords
      const totalKeywords = keywords.length;

      // Calculate average difficulty
      const keywordsWithDifficulty = keywords.filter((k) => 
        k.difficulty !== undefined && k.difficulty !== null
      );

      let avgDifficulty = 0;
      if (keywordsWithDifficulty.length > 0) {
        const totalDifficulty = keywordsWithDifficulty.reduce(
          (sum, k) => sum + (k.difficulty || 0),
          0
        );
        avgDifficulty = totalDifficulty / keywordsWithDifficulty.length;
      }

      // Calculate top intents
      const intentCounts: Record<string, number> = {};
      keywords.forEach((k) => {
        if (k.intent) {
          intentCounts[k.intent] = (intentCounts[k.intent] || 0) + 1;
        }
      });

      const topIntents = Object.entries(intentCounts)
        .map(([intent, count]) => ({ intent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 2);

      // In a real implementation, we would get this from the rank tracking data
      // For now, let's use a placeholder value
      const topRanked = 0;

      setMetrics({
        totalKeywords,
        avgDifficulty,
        topIntents,
        topRanked,
      });
    } else {
      setMetrics({
        totalKeywords: 0,
        avgDifficulty: 0,
        topIntents: [],
        topRanked: 0,
      });
    }
  }, [keywords]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start">
            <Tag className="h-8 w-8 p-1.5 mr-3 text-primary bg-primary/10 rounded-lg" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Keywords</p>
              <h3 className="text-2xl font-bold">{metrics.totalKeywords}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start">
            <BarChart2 className="h-8 w-8 p-1.5 mr-3 text-blue-500 bg-blue-500/10 rounded-lg" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Difficulty</p>
              <h3 className="text-2xl font-bold">
                {metrics.avgDifficulty ? metrics.avgDifficulty.toFixed(1) : '0'}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start">
            <TrendingUp className="h-8 w-8 p-1.5 mr-3 text-green-500 bg-green-500/10 rounded-lg" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top 10 Rankings</p>
              <h3 className="text-2xl font-bold">{metrics.topRanked}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start">
            <AlertCircle className="h-8 w-8 p-1.5 mr-3 text-orange-500 bg-orange-500/10 rounded-lg" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top Intent</p>
              <h3 className="text-2xl font-bold capitalize">
                {metrics.topIntents.length > 0
                  ? metrics.topIntents[0].intent
                  : '—'}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}