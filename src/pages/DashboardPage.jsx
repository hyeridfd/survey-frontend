import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../lib/authStore'

const SURVEYS = [
  { key: 'basic', label: '기초 조사표', icon: '📝', path: '/survey/basic', field: 'basic_survey_completed' },
  { key: 'nutrition', label: '영양 조사표', icon: '🥗', path: '/survey/nutrition', field: 'nutrition_survey_completed' },
  { key: 'satisfaction', label: '만족도 및 선호도 조사표', icon: '😊', path: '/survey/satisfaction', field: 'satisfaction_survey_completed' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/surveys/progress')
      .then(r => setProgress(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const completedCount = progress
    ? SURVEYS.filter(s => progress[s.field]).length
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 바 */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">📋 설문 선택</h1>
        <button onClick={() => { logout(); navigate('/login') }} className="text-sm text-gray-500 hover:text-red-600">
          로그아웃
        </button>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* 사용자 정보 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            ['🏥 요양원', user?.nursing_home_name || user?.nursing_home_id],
            ['👤 조사원', user?.surveyor_id],
            ['👴 어르신', user?.elderly_id],
          ].map(([label, val]) => (
            <div key={label} className="card py-3 text-center">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{val}</p>
            </div>
          ))}
        </div>

        {/* 진행 현황 */}
        <div className="card">
          <h2 className="section-title">📊 설문 진행 현황</h2>
          {loading ? (
            <p className="text-sm text-gray-400">불러오는 중...</p>
          ) : (
            <>
              <div className="progress-bar mb-2">
                <div className="progress-fill" style={{ width: `${(completedCount / 3) * 100}%` }} />
              </div>
              <p className="text-xs text-gray-500 mb-4">{completedCount} / 3 완료</p>

              {progress?.all_surveys_completed && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 mb-4">
                  🎉 모든 설문이 완료되었습니다!
                </div>
              )}

              <div className="space-y-2">
                {SURVEYS.map((s, i) => (
                  <div key={s.key} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">{i + 1}. {s.label}</span>
                    {progress?.[s.field]
                      ? <span className="badge-complete">✅ 완료</span>
                      : <span className="badge-incomplete">⏳ 미완료</span>
                    }
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 설문 선택 버튼 */}
        <div className="card">
          <h2 className="section-title">설문 선택</h2>
          <div className="space-y-3">
            {SURVEYS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => navigate(s.path)}
                className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{i + 1}. {s.label}</p>
                    {progress?.[s.field] && (
                      <p className="text-xs text-green-600">완료됨 (수정 가능)</p>
                    )}
                  </div>
                </div>
                <span className="text-blue-500">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
