'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plane, 
  MapPin, 
  FileCheck, 
  Scale,
  Lightbulb,
  Search,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { countriesApi, visaApi, legalApi, funFactsApi, Country, VisaInfo, LegalRestriction, FunFact } from '@/lib/api';
import { useUserStore } from '@/store';

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [tab, setTab] = useState<'visa' | 'legal' | 'facts'>('visa');
  const [visaInfo, setVisaInfo] = useState<VisaInfo | null>(null);
  const [restrictions, setRestrictions] = useState<LegalRestriction[]>([]);
  const [facts, setFacts] = useState<FunFact[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  
  const { nationality } = useUserStore();

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (search) {
      setFilteredCountries(countries.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.nameZh?.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      ));
    } else {
      setFilteredCountries(countries);
    }
  }, [search, countries]);

  const loadCountries = async () => {
    try {
      const data = await countriesApi.list();
      setCountries(data);
      setFilteredCountries(data);
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectCountry = async (country: Country) => {
    setSelectedCountry(country);
    setDetailLoading(true);
    setTab('visa');
    
    try {
      // Load visa info
      const nationalityCode = nationality || 'TW';
      const visa = await visaApi.get(nationalityCode, country.code);
      setVisaInfo(visa);
      
      // Load legal restrictions
      const legal = await legalApi.get(country.code);
      setRestrictions(legal.restrictions);
      
      // Load fun facts
      const factsData = await funFactsApi.get(country.code);
      setFacts(factsData.facts);
    } catch (error) {
      console.error('Failed to load country details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const getRequirementColor = (requirement: string) => {
    switch (requirement) {
      case 'VISA_FREE': return 'bg-green-100 text-green-800';
      case 'VISA_ON_ARRIVAL': return 'bg-blue-100 text-blue-800';
      case 'E_VISA': return 'bg-purple-100 text-purple-800';
      case 'ETA': return 'bg-indigo-100 text-indigo-800';
      case 'VISA_REQUIRED': return 'bg-orange-100 text-orange-800';
      case 'VISA_RESTRICTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH': return 'border-red-500 bg-red-50';
      case 'MEDIUM': return 'border-orange-500 bg-orange-50';
      case 'LOW': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  if (selectedCountry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Plane className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Travel Helper</span>
            </Link>
            <button
              onClick={() => setSelectedCountry(null)}
              className="text-gray-600 hover:text-blue-600 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Country Header */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{selectedCountry.flagEmoji}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedCountry.nameZh || selectedCountry.name}
                </h1>
                <p className="text-gray-500">{selectedCountry.name} · {selectedCountry.code}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab('visa')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                tab === 'visa' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              簽證資訊
            </button>
            <button
              onClick={() => setTab('legal')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                tab === 'legal' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Scale className="w-4 h-4" />
              法律禁忌 ({restrictions.length})
            </button>
            <button
              onClick={() => setTab('facts')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                tab === 'facts' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              趣味知識 ({facts.length})
            </button>
          </div>

          {/* Content */}
          {detailLoading ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <p className="text-gray-500">載入中...</p>
            </div>
          ) : (
            <>
              {/* Visa Tab */}
              {tab === 'visa' && visaInfo && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">簽證要求</h2>
                    <span className={`px-4 py-2 rounded-full font-medium ${getRequirementColor(visaInfo.requirement)}`}>
                      {visaInfo.requirementText}
                    </span>
                  </div>

                  {visaInfo.durationDays && (
                    <div className="mb-4">
                      <span className="text-gray-500">可停留天數：</span>
                      <span className="font-semibold text-gray-900 ml-2">
                        {visaInfo.durationDays} 天
                        {visaInfo.durationNote && ` (${visaInfo.durationNote})`}
                      </span>
                    </div>
                  )}

                  {visaInfo.notes && (
                    <div className="p-4 bg-blue-50 rounded-xl mb-4">
                      <p className="text-blue-800">{visaInfo.notes}</p>
                    </div>
                  )}

                  {visaInfo.processingTime && (
                    <div className="mb-4">
                      <span className="text-gray-500">處理時間：</span>
                      <span className="text-gray-900 ml-2">{visaInfo.processingTime}</span>
                    </div>
                  )}

                  {visaInfo.fee && (
                    <div className="mb-4">
                      <span className="text-gray-500">費用：</span>
                      <span className="text-gray-900 ml-2">
                        {visaInfo.feeCurrency} {visaInfo.fee}
                      </span>
                    </div>
                  )}

                  {visaInfo.passportValidity && (
                    <div className="mb-4">
                      <span className="text-gray-500">護照效期要求：</span>
                      <span className="text-gray-900 ml-2">{visaInfo.passportValidity}</span>
                    </div>
                  )}

                  {visaInfo.officialUrl && (
                    <a
                      href={visaInfo.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      查看官方資訊
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {/* Legal Tab */}
              {tab === 'legal' && (
                <div className="space-y-4">
                  {restrictions.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                      <p className="text-gray-500">暫無法律禁忌資訊</p>
                    </div>
                  ) : (
                    restrictions.map((r) => (
                      <div
                        key={r.id}
                        className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${getSeverityColor(r.severity)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{r.title}</h3>
                          <span className="text-sm text-gray-500">{r.severityText}</span>
                        </div>
                        <p className="text-gray-600 mb-3">{r.description}</p>
                        
                        {r.items && r.items.length > 0 && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-500">相關物品：</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {r.items.map((item, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {r.penalty && (
                          <div className="text-sm text-red-600">
                            ⚠️ {r.penalty}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Facts Tab */}
              {tab === 'facts' && (
                <div className="space-y-4">
                  {facts.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                      <p className="text-gray-500">暫無趣味知識</p>
                    </div>
                  ) : (
                    facts.map((f) => (
                      <div key={f.id} className="bg-white rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                            {f.categoryName}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                        <p className="text-gray-600">{f.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </main>
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
          <Link href="/" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            返回首頁
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">國家資訊</h1>
        <p className="text-gray-500 mb-6">查詢簽證要求、法律禁忌和趣味知識</p>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋國家..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Countries Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">載入中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => selectCountry(country)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{country.flagEmoji}</span>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {country.nameZh || country.name}
                    </div>
                    <div className="text-sm text-gray-500">{country.code}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}