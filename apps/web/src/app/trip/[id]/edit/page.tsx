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
  Save,
  RefreshCw,
  X
} from 'lucide-react';
import { tripApi } from '@/lib/api';
import type { SavedTrip } from '@/lib/api';

const BUDGET_OPTIONS = [
  { value: 'LOW', label: '省錢背包客', emoji: '💰' },
  { value: 'MEDIUM', label: '一般旅遊', emoji: '💵' },
  { value: 'HIGH', label: '奢華體驗', emoji: '💎' },
];

const TRAVEL_STYLES = [
  { id: 'culture', label: '文化探索', emoji: '🏛️' },
  { id: 'food', label: '美食之旅', emoji: '🍜' },
  { id: 'nature', label: '自然風景', emoji: '🏔️' },
  { id: 'shopping', label: '購物血拼', emoji: '🛍️' },
  { id: 'adventure', label: '冒險體驗', emoji: '🎢' },
  { id: 'relax', label: '悠閒度假', emoji: '🏖️' },
];

export default function EditTripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  
  // Edit form state
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [city, setCity] = useState('');
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState('MEDIUM');
  const [styles, setStyles] = useState<string[]>([]);
  const [itineraryText, setItineraryText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  const [showRegenerate, setShowRegenerate] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    try {
      const data = await tripApi.get(tripId);
      setTrip(data);
      
      // Populate form
      setTitle(data.title || '');
      setDestination(data.destination);
      setCity(data.city || '');
      setDays(data.duration || 5);
      setBudget(data.budgetLevel || 'MEDIUM');
      setStyles(data.travelStyles || []);
      setItineraryText(data.itineraryText || '');
      setStartDate(data.startDate);
    } catch (error) {
      console.error('Failed to load trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStyle = (styleId: string) => {
    setStyles(prev => 
      prev.includes(styleId) 
        ? prev.filter(s => s !== styleId)
        : [...prev, styleId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await tripApi.update(tripId, {
        title,
        destination,
        city,
        days,
        budgetLevel: budget,
        travelStyles: styles,
        itineraryText,
        startDate,
        endDate: startDate ? new Date(new Date(startDate).getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      });
      router.push('/my-trips');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const result = await tripApi.regenerate(tripId, specialRequests);
      setItineraryText(result.itineraryText);
      setShowRegenerate(false);
      setSpecialRequests('');
    } catch (error) {
      console.error('Failed to regenerate:', error);
      alert('重新生成失敗，請稍後再試');
    } finally {
      setRegenerating(false);
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
            取消
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">編輯行程</h1>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本資訊</h2>
          
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">行程名稱</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：東京 5 天之旅"
            />
          </div>

          {/* Destination */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目的地</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">城市（選填）</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Days & Date */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">天數</label>
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1,2,3,4,5,6,7,8,9,10,14,21].map(d => (
                  <option key={d} value={d}>{d} 天</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">出發日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Budget */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">預算類型</label>
            <div className="grid grid-cols-3 gap-2">
              {BUDGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBudget(option.value)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    budget === option.value
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{option.emoji}</span>
                  <div className="text-sm font-medium mt-1">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Travel Styles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">旅遊風格</label>
            <div className="grid grid-cols-3 gap-2">
              {TRAVEL_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => toggleStyle(style.id)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    styles.includes(style.id)
                      ? 'bg-purple-50 border-2 border-purple-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{style.emoji}</span>
                  <div className="text-sm mt-1">{style.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Itinerary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              行程內容
            </h2>
            <button
              onClick={() => setShowRegenerate(!showRegenerate)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              重新生成
            </button>
          </div>

          {showRegenerate && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                特別需求（選填）
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="例如：希望多安排美食、避開人多的景點..."
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowRegenerate(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {regenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  重新生成
                </button>
              </div>
            </div>
          )}

          <textarea
            value={itineraryText}
            onChange={(e) => setItineraryText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows={15}
            placeholder="行程內容..."
          />
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <Link
            href="/my-trips"
            className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center"
          >
            取消
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                儲存變更
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}