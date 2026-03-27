'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  DollarSign,
  Sparkles,
  Loader2,
  ArrowLeft,
  Share2,
  Trash2,
  Copy,
  Check,
  Edit
} from 'lucide-react';
import { tripApi } from '@/lib/api';
import type { SavedTrip } from '@/lib/api';

const BUDGET_LABELS: Record<string, string> = {
  LOW: '省錢背包客',
  MEDIUM: '一般旅遊',
  HIGH: '奢華體驗',
};

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    try {
      const data = await tripApi.get(tripId);
      setTrip(data);
    } catch (error) {
      console.error('Failed to load trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const result = await tripApi.share(tripId);
      setShareUrl(result.shareUrl);
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('確定要刪除這個行程嗎？')) return;
    
    try {
      await tripApi.delete(tripId);
      router.push('/my-trips');
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">找不到行程</h1>
          <Link href="/my-trips" className="text-blue-600 hover:underline">
            返回我的行程
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Travel Helper</span>
          </Link>
          <Link href="/my-trips" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Trip Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {trip.title}
            </h1>
            <div className="flex items-center gap-2">
              <Link
                href={`/trip/${trip.id}/edit`}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="編輯"
              >
                <Edit className="w-5 h-5" />
              </Link>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="刪除"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {trip.destination}
              {trip.city && ` · ${trip.city}`}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {trip.duration} 天
            </div>
            {trip.budgetLevel && (
              <div className="flex items-center gap-2">
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

        {/* Share Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            分享行程
          </h2>
          
          {!shareUrl ? (
            <button
              onClick={handleShare}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              產生分享連結
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      已複製
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      複製
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                分享此連結讓朋友查看你的行程規劃
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}