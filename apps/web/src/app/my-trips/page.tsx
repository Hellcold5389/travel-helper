'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Trash2,
  Share2,
  Edit,
  ChevronRight,
  ArrowLeft,
  FolderOpen
} from 'lucide-react';
import { tripApi } from '@/lib/api';
import { useUserStore, getOrCreateUserId } from '@/store';
import type { SavedTrip } from '@/lib/api';

export default function MyTripsPage() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  
  const { userId, setUserId } = useUserStore();

  useEffect(() => {
    if (!userId) {
      setUserId(getOrCreateUserId());
    }
    loadTrips();
  }, [userId]);

  const loadTrips = async () => {
    try {
      const result = await tripApi.list(userId || undefined);
      setTrips(result.trips);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個行程嗎？')) return;
    
    try {
      await tripApi.delete(id);
      setTrips(trips.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete trip:', error);
    }
  };

  const handleShare = async (id: string) => {
    try {
      const result = await tripApi.share(id);
      setShareUrl(result.shareUrl);
      // Copy to clipboard
      await navigator.clipboard.writeText(result.shareUrl);
      alert('分享連結已複製！');
    } catch (error) {
      console.error('Failed to share trip:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Travel Helper</span>
          </Link>
          <Link href="/plan" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            + 新增行程
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">我的行程</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">載入中...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">尚無儲存的行程</h2>
            <p className="text-gray-500 mb-6">開始規劃你的第一趟旅程吧！</p>
            <Link
              href="/plan"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              規劃新行程
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {trip.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {trip.destination}
                        {trip.city && ` · ${trip.city}`}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {trip.duration} 天
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {trip.startDate} ~ {trip.endDate}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {trip.shareId && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        已分享
                      </span>
                    )}
                    <Link
                      href={`/trip/${trip.id}/edit`}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="編輯"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleShare(trip.id)}
                      className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                      title="分享"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(trip.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="刪除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <Link
                  href={`/trip-detail/${trip.id}`}
                  className="mt-4 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  查看詳情
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}