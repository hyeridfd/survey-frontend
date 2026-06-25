import { useNavigate } from 'react-router-dom'

export default function SurveyLayout({ title, icon, page, totalPages, onPrev, onNext, onDashboard, nextLabel, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={onDashboard} className="text-gray-400 hover:text-gray-700 text-xl">←</button>
        <div>
          <h1 className="text-base font-bold text-gray-900">{icon} {title}</h1>
          <p className="text-xs text-gray-400">페이지 {page} / {totalPages}</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* 진행 바 */}
        <div className="progress-bar mb-6">
          <div className="progress-fill" style={{ width: `${(page / totalPages) * 100}%` }} />
        </div>

        {/* 페이지 내용 */}
        <div className="card mb-4">
          {children}
        </div>

        {/* 네비게이션 */}
        <div className="flex gap-3">
          <button onClick={onDashboard} className="btn-secondary px-4">🏠</button>
          {page > 1 && (
            <button onClick={onPrev} className="btn-secondary flex-1">← 이전</button>
          )}
          <button onClick={onNext} className="btn-primary flex-1">
            {nextLabel || (page < totalPages ? '다음 →' : '✅ 제출')}
          </button>
        </div>
      </div>
    </div>
  )
}
