import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../lib/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [nursingHomeId] = useState('NH001')
  const [surveyorId, setSurveyorId] = useState('SRV01')
  const [elNum, setElNum] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [adminOpen, setAdminOpen] = useState(false)
  const [adminPw, setAdminPw] = useState('')
  const [adminError, setAdminError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!elNum) { setError('어르신 번호를 입력해주세요.'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/login', {
        nursing_home_id: nursingHomeId,
        surveyor_id: surveyorId,
        elderly_id: `HC${elNum}`,
      })
      setAuth(res.data.token, {
        nursing_home_id: res.data.nursing_home_id,
        surveyor_id: res.data.surveyor_id,
        elderly_id: res.data.elderly_id,
        nursing_home_name: res.data.nursing_home_name,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || '로그인 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setAdminError('')
    try {
      const res = await api.post('/auth/admin-login', { password: adminPw })
      setAuth(res.data.token, null, true)
      navigate('/admin')
    } catch (err) {
      setAdminError(err.response?.data?.detail || '비밀번호가 올바르지 않습니다.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(160deg, #0a2e6e 0%, #1151b8 45%, #2979d4 75%, #4facfe 100%)'
    }}>

      {/* 상단 헤더 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pt-12 pb-6">

        {/* 로고 + 타이틀 */}
        <div className="text-center mb-8">
          {/* 아이콘 뱃지 */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 shadow-lg"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <span style={{ fontSize: '40px' }}>🐟</span>
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight mb-2">
            요양원 건강 및<br />블루푸드 설문조사
          </h1>

          {/* 배지 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mt-2"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse inline-block"></span>
            <span className="text-xs text-blue-100 font-medium">Pilot Test</span>
          </div>
        </div>

        {/* 로그인 카드 */}
        <div className="w-full max-w-sm">
          <div className="rounded-3xl p-6 shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>

            <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-blue-600 inline-block"></span>
              설문 조사 로그인
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* 요양원 ID */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">요양원 ID</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400 font-medium"
                  value={nursingHomeId} disabled />
              </div>

              {/* 조사원 ID */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">조사원 ID</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={surveyorId} onChange={e => setSurveyorId(e.target.value)}>
                  {['SRV01','SRV02','SRV03'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>

              {/* 어르신 ID */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">어르신 ID</label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center w-16 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm font-bold">
                    HC
                  </div>
                  <input
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="01"
                    value={elNum}
                    onChange={e => setElNum(e.target.value.replace(/\D/g, ''))}
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <span className="text-red-500 text-sm">⚠️</span>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide shadow-lg transition-all disabled:opacity-60"
                style={{ background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1151b8 0%, #2979d4 100%)' }}>
                {loading ? '로그인 중...' : '로그인 →'}
              </button>
            </form>
          </div>

          {/* 관리자 로그인 */}
          <div className="mt-3 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <button
              className="w-full px-5 py-3.5 text-left text-sm text-blue-100 font-medium flex justify-between items-center"
              onClick={() => setAdminOpen(!adminOpen)}>
              <span className="flex items-center gap-2">
                <span className="text-base">🔐</span> 관리자 로그인
              </span>
              <span className="text-blue-200 text-xs">{adminOpen ? '▲' : '▼'}</span>
            </button>

            {adminOpen && (
              <form onSubmit={handleAdminLogin} className="px-5 pb-4 space-y-3">
                <input
                  type="password"
                  className="w-full border border-white/20 rounded-xl px-4 py-3 text-sm bg-white/10 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/40"
                  value={adminPw}
                  onChange={e => setAdminPw(e.target.value)}
                  placeholder="비밀번호 입력"
                />
                {adminError && <p className="text-xs text-red-300">{adminError}</p>}
                <button type="submit"
                  className="w-full py-3 rounded-xl text-sm font-semibold text-blue-900 transition-all"
                  style={{ background: 'rgba(255,255,255,0.9)' }}>
                  관리자로 로그인
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="text-center pb-8 px-4">
        <p className="text-xs text-blue-200 leading-relaxed">
          서울대학교 정밀식의약솔루션 연구실<br />
          글로벌 블루푸드 미래리더 양성 프로젝트
        </p>
      </div>
    </div>
  )
}