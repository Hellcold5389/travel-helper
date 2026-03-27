'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  DollarSign,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { tripApi } from '@/lib/api';
import type { SavedTrip } from '@/lib/api';

const BUDGET_LABELS: Record<string, string> = {
  LOW: '省錢背包客',
  MEDIUM: '一般旅遊',
  HIGH: '奢華體驗',
};

export default function SharedTripPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrip();
  }, [shareId]);

  const loadTrip = async () => {
    try {
      const data = await tripApi.getByShareId(shareId);
      setTrip(data);
    } catch (err) {
      setError('找不到此行程或連結已失效');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">找不到行程</h1>
          <p className="text-gray-500 mb-6">{error || '此分享連結可能已失效或不存在'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plane className="w-5 h-5" />
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Travel Helper</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Shared Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
          <span>🔗</span>
          分享的行程
        </div>

        {/* Trip Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {trip.title}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              {trip.destination}
              {trip.city && ` · ${trip.city}`}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              {trip.duration} 天
            </div>
            {trip.budgetLevel && (
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="w-4 h-4" />
                {BUDGET_LABELS[trip.budgetLevel] || trip.budgetLevel}
              </div>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            {trip.startDate} ~ {trip.endDate}
          </div>
        </div>

        {/* Itinerary */}
        {trip.itineraryText && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              行程內容
            </h2>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                {trip.itineraryText}
              </pre>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">想規劃自己的行程？</h3>
          <p className="text-blue-100 mb-4">使用 AI 幫你規劃完美的旅程</p>
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            開始規劃
          </Link>
        </div>
      </main>
    </div>
  );
}