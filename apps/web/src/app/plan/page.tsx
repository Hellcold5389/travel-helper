'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  DollarSign,
  Sparkles,
  Loader2,
  ChevronRight,
  Check,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  Save,
  Share2,
  Copy,
  Link2
} from 'lucide-react';
import { tripApi } from '@/lib/api';
import { useUserStore, getOrCreateUserId } from '@/store';

type Step = 'destination' | 'days' | 'budget' | 'style' | 'generating' | 'result';

const TRAVEL_STYLES = [
  { id: 'culture', label: '文化探索', emoji: '🏛️' },
  { id: 'food', label: '美食之旅', emoji: '🍜' },
  { id: 'nature', label: '自然風景', emoji: '🏔️' },
  { id: 'shopping', label: '購物血拼', emoji: '🛍️' },
  { id: 'adventure', label: '冒險體驗', emoji: '🎢' },
  { id: 'relax', label: '悠閒度假', emoji: '🏖️' },
];

const BUDGET_OPTIONS = [
  { value: 'LOW', label: '省錢背包客', description: '尋找免費或便宜的活動', emoji: '💰' },
  { value: 'MEDIUM', label: '一般旅遊', description: '平衡舒適和預算', emoji: '💵' },
  { value: 'HIGH', label: '奢華體驗', description: '不設預算上限', emoji: '💎' },
];

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 21];

export default function PlanPage() {
  const [step, setStep] = useState<Step>('destination');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState<number>(5);
  const [budget, setBudget] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [styles, setStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [countryInfo, setCountryInfo] = useState<{
    countryCode: string;
    countryName?: string;
    city?: string;
  } | null>(null);
  const [error, setError] = useState<string>('');
  
  const { userId, setUserId } = useUserStore();

  useEffect(() => {
    if (!userId) {
      setUserId(getOrCreateUserId());
    }
  }, [userId, setUserId]);

  const toggleStyle = (styleId: string) => {
    setStyles(prev => 
      prev.includes(styleId) 
        ? prev.filter(s => s !== styleId)
        : [...prev, styleId]
    );
  };

  const handleDestinationSubmit = async () => {
    if (!destination.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const match = await tripApi.matchDestination(destination);
      if (match) {
        setCountryInfo(match);
        setStep('days');
      } else {
        setError('無法識別此目的地，請嘗試其他名稱（如：日本、東京、泰國）');
      }
    } catch {
      setError('查詢失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!userId || !countryInfo) return;
    
    setStep('generating');
    setLoading(true);
    setError('');
    
    try {
      const plan = await tripApi.plan({
        destination,
        countryCode: countryInfo.countryCode,
        city: countryInfo.city,
        days,
        budget,
        travelStyles: styles,
      });
      
      setResult(plan.itineraryText);
      setStep('result');
    } catch (err) {
      setError('生成失敗，請稍後再試');
      setStep('style');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('destination');
    setDestination('');
    setDays(5);
    setBudget('MEDIUM');
    setStyles([]);
    setResult('');
    setCountryInfo(null);
    setError('');
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
          <Link href="/" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            返回首頁
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['目的地', '天數', '預算', '風格', '生成'].map((label, i) => {
              const stepOrder = ['destination', 'days', 'budget', 'style', 'generating', 'result'];
              const currentIndex = stepOrder.indexOf(step);
              const isActive = i <= Math.min(currentIndex, 4);
              
              return (
                <div key={label} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                    {isActive && i < currentIndex ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                    {label}
                  </span>
                  {i < 4 && (
                    <div className={`w-12 h-1 mx-4 rounded ${i < currentIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step: Destination */}
        {step === 'destination' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">你想去哪裡？</h2>
                <p className="text-gray-500">輸入國家或城市名稱</p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDestinationSubmit()}
                placeholder="例如：日本、東京、泰國、巴黎..."
                className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              
              <button
                onClick={handleDestinationSubmit}
                disabled={!destination.trim() || loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    下一步
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Popular Destinations */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3">熱門目的地</p>
              <div className="flex flex-wrap gap-2">
                {['日本', '韓國', '泰國', '新加坡', '香港', '台灣'].map((dest) => (
                  <button
                    key={dest}
                    onClick={() => {
                      setDestination(dest);
                      setTimeout(() => handleDestinationSubmit(), 100);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-blue-100 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Days */}
        {step === 'days' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">規劃幾天？</h2>
                <p className="text-gray-500">選擇旅遊天數</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {DAYS_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    days === d
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {d} 天
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('destination')}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                上一步
              </button>
              <button
                onClick={() => setStep('budget')}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                下一步
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Budget */}
        {step === 'budget' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">預算類型</h2>
                <p className="text-gray-500">選擇你的旅遊預算等級</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {BUDGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBudget(option.value as typeof budget)}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                    budget === option.value
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                  {budget === option.value && (
                    <Check className="w-5 h-5 text-blue-600 ml-auto" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('days')}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                上一步
              </button>
              <button
                onClick={() => setStep('style')}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                下一步
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Style */}
        {step === 'style' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">旅遊風格</h2>
                <p className="text-gray-500">選擇你喜歡的旅遊風格（可複選）</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {TRAVEL_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => toggleStyle(style.id)}
                  className={`p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                    styles.includes(style.id)
                      ? 'bg-purple-50 border-2 border-purple-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl">{style.emoji}</span>
                  <span className="font-medium text-gray-900">{style.label}</span>
                  {styles.includes(style.id) && (
                    <Check className="w-5 h-5 text-purple-600 ml-auto" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('budget')}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                上一步
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    生成行程
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 正在規劃你的行程...</h2>
            <p className="text-gray-500">這可能需要 10-30 秒</p>
          </div>
        )}

        {/* Step: Result */}
        {step === 'result' && result && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {countryInfo?.city || destination} {days} 天行程
                </h2>
                <button
                  onClick={reset}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  重新規劃
                </button>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {countryInfo?.countryName || destination}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {days} 天
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  {BUDGET_OPTIONS.find(b => b.value === budget)?.label}
                </div>
              </div>
            </div>

            {/* Itinerary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                AI 行程建議
              </h3>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                  {result}
                </pre>
              </div>
            </div>

            {/* Save & Share Actions */}
            <SaveShareSection
              userId={userId}
              destination={destination}
              countryCode={countryInfo?.countryCode || ''}
              city={countryInfo?.city}
              days={days}
              budget={budget}
              styles={styles}
              itineraryText={result}
            />

            {/* Navigation Actions */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                規劃新行程
              </button>
              <Link
                href="/my-trips"
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-center"
              >
                查看我的行程
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Save & Share Section Component
function SaveShareSection({
  userId,
  destination,
  countryCode,
  city,
  days,
  budget,
  styles,
  itineraryText
}: {
  userId: string | null;
  destination: string;
  countryCode: string;
  city?: string;
  days: number;
  budget: string;
  styles: string[];
  itineraryText: string;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (!destination || !countryCode) return;
    
    setSaving(true);
    try {
      const trip = await tripApi.save({
        userId: userId || undefined,
        title: `${city || destination} ${days}天行程`,
        destination,
        countryCode,
        city,
        days,
        budgetLevel: budget,
        travelStyles: styles,
        itineraryText,
      });
      setTripId(trip.id);
      setSaved(true);
    } catch (error) {
      console.error('Failed to save trip:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!tripId) return;
    
    setSharing(true);
    try {
      const result = await tripApi.share(tripId);
      setShareUrl(result.shareUrl);
    } catch (error) {
      console.error('Failed to share trip:', error);
    } finally {
      setSharing(false);
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

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Save className="w-5 h-5 text-blue-600" />
        儲存與分享
      </h3>
      
      <div className="space-y-4">
        {!saved ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                儲存行程
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">行程已儲存！</span>
            </div>
            
            {!shareUrl ? (
              <button
                onClick={handleShare}
                disabled={sharing}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sharing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Share2 className="w-5 h-5" />
                    產生分享連結
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                  <Link2 className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium"
                  >
                    {copied ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        已複製
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-4 h-4" />
                        複製
                      </span>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  分享此連結讓朋友查看你的行程規劃
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}