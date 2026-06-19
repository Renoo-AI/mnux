'use client';

import { useState } from 'react';
import { Star, TrendingUp, MessageSquare, ThumbsUp, Download, BarChart3, PieChart } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { FeedbackCard, FeedbackStats, RatingStars } from '@/components/feedback-system';
import type { FeedbackRating } from '@/components/feedback-system';

export default function FeedbackPage() {
  const [feedbacks] = useState<FeedbackRating[]>([]);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filter === 'positive') return f.rating >= 4;
    if (filter === 'negative') return f.rating < 4;
    return true;
  });

  return (
    <DashboardLayout>
      <TopAppBar
        title="Customer Feedback"
        subtitle="Reviews & ratings"
        showSearch={false}
        user={{ name: 'Manager', role: 'manager' }}
      />

      <div className="p-6 md:p-10 max-w-7xl w-full mx-auto space-y-8 animate-fade-in">
        {/* Stats Overview */}
        <FeedbackStats feedbacks={feedbacks} />

        {/* Empty State for Charts */}
        {feedbacks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-card text-center">
            <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-on-surface-variant" />
            </div>
            <h3 className="font-display text-title-sm text-primary mb-2">No feedback yet</h3>
            <p className="text-on-surface-variant">Customer feedback will appear here once orders are completed with ratings</p>
          </div>
        ) : (
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rating Distribution */}
              <div className="bg-white rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-title-sm text-primary flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-secondary" />
                    Rating Distribution
                  </h3>
                  <span className="text-on-surface-variant text-sm">{feedbacks.length} reviews</span>
                </div>
                <p className="text-on-surface-variant text-center py-8">Rating distribution will appear as feedback is collected</p>
              </div>

              {/* Category Scores */}
              <div className="bg-white rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-title-sm text-primary flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-accent" />
                    Category Scores
                  </h3>
                </div>
                <p className="text-on-surface-variant text-center py-8">Category scores will appear as feedback is collected</p>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-title-sm text-primary flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  Rating Trend
                </h3>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                  className="px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm focus:border-secondary focus:ring-2 focus:ring-secondary-fixed/20"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              
              <p className="text-on-surface-variant text-center py-12">Rating trends will appear as more feedback is collected</p>
            </div>
          </>
        )}

        {/* Feedback List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-headline-sm text-primary">Recent Feedback</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-xl">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'all' ? 'bg-white shadow text-primary' : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('positive')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'positive' ? 'bg-white shadow text-primary' : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Positive
                </button>
                <button
                  onClick={() => setFilter('negative')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'negative' ? 'bg-white shadow text-primary' : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Needs Attention
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeedbacks.map((feedback) => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))}
          </div>

          {filteredFeedbacks.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-on-surface-variant" />
              </div>
              <h3 className="font-display text-title-sm text-primary mb-2">No feedback found</h3>
              <p className="text-on-surface-variant">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
