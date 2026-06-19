'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageSquare, Send, X, Coffee, Utensils, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FeedbackRating {
  id: string;
  orderId: string;
  tableName: string;
  rating: number;
  categories: {
    food: number;
    service: number;
    ambiance: number;
    value: number;
  };
  comment?: string;
  wouldRecommend: boolean;
  createdAt: Date;
}

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export function RatingStars({ value, onChange, size = 'md', readonly = false }: RatingStarsProps) {
  const [hovered, setHovered] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-transform duration-150 hover:scale-110`}
        >
          <Star
            className={`${sizeClasses[size]} transition-colors duration-200 ${
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-outline-variant'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

interface CategoryRatingProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
}

function CategoryRating({ label, icon, value, onChange }: CategoryRatingProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-surface-container-low rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary">
          {icon}
        </div>
        <span className="font-medium text-primary">{label}</span>
      </div>
      <RatingStars value={value} onChange={onChange} size="md" />
    </div>
  );
}

interface FeedbackModalProps {
  orderId: string;
  tableName: string;
  onSubmit: (feedback: Omit<FeedbackRating, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export function FeedbackModal({ orderId, tableName, onSubmit, onClose }: FeedbackModalProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [categories, setCategories] = useState({
    food: 0,
    service: 0,
    ambiance: 0,
    value: 0,
  });
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async () => {
    if (overallRating === 0) return;
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onSubmit({
      orderId,
      tableName,
      rating: overallRating,
      categories,
      comment: comment || undefined,
      wouldRecommend: wouldRecommend ?? false,
    });
    
    setIsSubmitting(false);
  };

  const getOverallLabel = () => {
    if (overallRating === 0) return 'Rate your experience';
    if (overallRating === 1) return 'Very Poor';
    if (overallRating === 2) return 'Poor';
    if (overallRating === 3) return 'Average';
    if (overallRating === 4) return 'Good';
    return 'Excellent!';
  };

  const getOverallEmoji = () => {
    if (overallRating <= 1) return '😔';
    if (overallRating === 2) return '😕';
    if (overallRating === 3) return '😐';
    if (overallRating === 4) return '😊';
    return '🤩';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-display text-title-md text-primary">Rate Your Experience</h2>
            <p className="text-on-surface-variant text-sm">{tableName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* Overall Rating */}
            <div className="text-center py-8">
              <div className="text-6xl mb-4 animate-bounce-subtle">
                {getOverallEmoji()}
              </div>
              <p className="font-display text-xl text-primary mb-4">{getOverallLabel()}</p>
              <RatingStars value={overallRating} onChange={setOverallRating} size="lg" />
            </div>

            {/* Category Ratings */}
            <div className="space-y-3">
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-2">
                Rate Specific Aspects
              </p>
              <CategoryRating
                label="Food Quality"
                icon={<Utensils className="w-4 h-4" />}
                value={categories.food}
                onChange={(v) => setCategories(prev => ({ ...prev, food: v }))}
              />
              <CategoryRating
                label="Service"
                icon={<Heart className="w-4 h-4" />}
                value={categories.service}
                onChange={(v) => setCategories(prev => ({ ...prev, service: v }))}
              />
              <CategoryRating
                label="Ambiance"
                icon={<Coffee className="w-4 h-4" />}
                value={categories.ambiance}
                onChange={(v) => setCategories(prev => ({ ...prev, ambiance: v }))}
              />
              <CategoryRating
                label="Value for Money"
                icon={<Sparkles className="w-4 h-4" />}
                value={categories.value}
                onChange={(v) => setCategories(prev => ({ ...prev, value: v }))}
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={overallRating === 0}
              className="w-full py-4 rounded-full bg-secondary text-white"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* Recommend */}
            <div>
              <p className="font-medium text-primary mb-4 text-center">
                Would you recommend us to a friend?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setWouldRecommend(true)}
                  className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    wouldRecommend === true
                      ? 'bg-secondary text-white shadow-lg scale-105'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  Yes!
                </button>
                <button
                  onClick={() => setWouldRecommend(false)}
                  className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    wouldRecommend === false
                      ? 'bg-surface-container-high text-primary shadow-lg'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <X className="w-5 h-5" />
                  No
                </button>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                ANY ADDITIONAL COMMENTS?
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-on-surface-variant" />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary focus:ring-2 focus:ring-secondary-fixed/20 transition-all resize-none h-32"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-full"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || wouldRecommend === null}
                className="flex-1 py-4 rounded-full bg-secondary text-white"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface FeedbackCardProps {
  feedback: FeedbackRating;
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  const avgCategory = (
    (feedback.categories.food + feedback.categories.service + feedback.categories.ambiance + feedback.categories.value) / 4
  ).toFixed(1);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-card border border-outline-variant/10 hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-display text-title-sm text-primary">{feedback.tableName}</h3>
          <p className="text-on-surface-variant text-xs">
            {new Date(feedback.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RatingStars value={feedback.rating} size="sm" readonly />
          <span className="font-bold text-primary">{feedback.rating}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {Object.entries(feedback.categories).map(([key, value]) => (
          <div key={key} className="text-center p-2 bg-surface-container-low rounded-lg">
            <p className="text-xs text-on-surface-variant capitalize">{key}</p>
            <p className="font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>

      {feedback.comment && (
        <p className="text-on-surface-variant text-sm italic bg-surface-container-low p-3 rounded-xl">
          &quot;{feedback.comment}&quot;
        </p>
      )}

      {feedback.wouldRecommend && (
        <div className="flex items-center gap-2 mt-3 text-secondary">
          <ThumbsUp className="w-4 h-4" />
          <span className="text-xs font-medium">Would recommend</span>
        </div>
      )}
    </div>
  );
}

interface FeedbackStatsProps {
  feedbacks: FeedbackRating[];
}

export function FeedbackStats({ feedbacks }: FeedbackStatsProps) {
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0.0';

  const avgCategories = feedbacks.length > 0
    ? {
        food: (feedbacks.reduce((sum, f) => sum + f.categories.food, 0) / feedbacks.length).toFixed(1),
        service: (feedbacks.reduce((sum, f) => sum + f.categories.service, 0) / feedbacks.length).toFixed(1),
        ambiance: (feedbacks.reduce((sum, f) => sum + f.categories.ambiance, 0) / feedbacks.length).toFixed(1),
        value: (feedbacks.reduce((sum, f) => sum + f.categories.value, 0) / feedbacks.length).toFixed(1),
      }
    : { food: '0.0', service: '0.0', ambiance: '0.0', value: '0.0' };

  const recommendRate = feedbacks.length > 0
    ? Math.round((feedbacks.filter(f => f.wouldRecommend).length / feedbacks.length) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-on-surface-variant text-sm">Overall Rating</span>
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        </div>
        <p className="font-display text-3xl text-primary">{avgRating}</p>
        <RatingStars value={parseFloat(avgRating)} size="sm" readonly />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-on-surface-variant text-sm">Recommend Rate</span>
          <ThumbsUp className="w-5 h-5 text-secondary" />
        </div>
        <p className="font-display text-3xl text-primary">{recommendRate}%</p>
        <p className="text-xs text-on-surface-variant">of customers</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-on-surface-variant text-sm">Total Reviews</span>
          <MessageSquare className="w-5 h-5 text-accent" />
        </div>
        <p className="font-display text-3xl text-primary">{feedbacks.length}</p>
        <p className="text-xs text-on-surface-variant">feedback received</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-on-surface-variant text-sm">Best Category</span>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        <p className="font-display text-xl text-primary capitalize">
          {Object.entries(avgCategories).reduce((a, b) => parseFloat(a[1]) > parseFloat(b[1]) ? a : b)[0]}
        </p>
        <p className="text-xs text-on-surface-variant">
          {Math.max(...Object.values(avgCategories).map(parseFloat)).toFixed(1)} avg
        </p>
      </div>
    </div>
  );
}

export type { FeedbackRating };
