import Link from "next/link";
import { 
  Plane, 
  FileCheck, 
  Scale, 
  Sparkles, 
  ChevronRight,
  MapPin,
  Calendar,
  DollarSign
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Travel Helper</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/plan" className="text-gray-600 hover:text-blue-600 transition-colors">
              行程規劃
            </Link>
            <Link href="/countries" className="text-gray-600 hover:text-blue-600 transition-colors">
              國家資訊
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI 旅遊助手
            <span className="block text-blue-600 mt-2">規劃你的完美旅程</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            智能行程規劃、簽證查詢、法律禁忌提醒，讓你輕鬆出遊無煩惱
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/plan" 
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
            >
              <Sparkles className="w-5 h-5" />
              開始規劃行程
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/countries" 
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <MapPin className="w-5 h-5" />
              瀏覽國家資訊
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            為你打造的旅遊功能
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles className="w-8 h-8 text-blue-600" />}
              title="AI 行程規劃"
              description="告訴我們你的目的地和偏好，AI 為你生成詳細的每日行程"
              href="/plan"
            />
            <FeatureCard
              icon={<FileCheck className="w-8 h-8 text-green-600" />}
              title="簽證查詢"
              description="快速查詢各國簽證要求，掌握入境資訊"
              href="/countries"
            />
            <FeatureCard
              icon={<Scale className="w-8 h-8 text-red-600" />}
              title="法律禁忌"
              description="了解目的地法律禁忌，避免觸法風險"
              href="/countries"
            />
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            三步完成行程規劃
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              icon={<MapPin className="w-6 h-6" />}
              title="選擇目的地"
              description="輸入你想去的國家或城市"
            />
            <StepCard
              number={2}
              icon={<Calendar className="w-6 h-6" />}
              title="設定偏好"
              description="選擇天數、預算和旅遊風格"
            />
            <StepCard
              number={3}
              icon={<Sparkles className="w-6 h-6" />}
              title="AI 生成"
              description="獲得專屬的詳細行程規劃"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="flex items-center justify-center gap-2">
            <Plane className="w-5 h-5" />
            Travel Helper - AI 旅遊助手
          </p>
          <p className="mt-2 text-sm">
            智能行程規劃 × 簽證查詢 × 法律禁忌提醒
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  href 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 h-full">
        <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  );
}

function StepCard({ 
  number, 
  icon, 
  title, 
  description 
}: { 
  number: number; 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
        {number}
      </div>
      <div className="flex items-center justify-center gap-2 text-gray-900 font-semibold mb-2">
        {icon}
        {title}
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}