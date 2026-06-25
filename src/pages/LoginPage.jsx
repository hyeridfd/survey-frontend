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
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* 헤더 */}
        <div className="text-center">
          <div className="text-4xl mb-2">📋</div>
          <h1 className="text-2xl font-bold text-gray-900">요양원 건강 및<br/>블루푸드 설문조사</h1>
          <p className="text-sm text-gray-500 mt-1">파일럿 테스트</p>
        </div>

        {/* 일반 로그인 */}
        <form onSubmit={handleLogin} className="card space-y-4">
          <h2 className="section-title">설문 조사 로그인</h2>

          <div>
            <label className="form-label">요양원 ID</label>
            <input className="form-input bg-gray-50" value={nursingHomeId} disabled />
          </div>

          <div>
            <label className="form-label">조사원 ID</label>
            <select className="form-select" value={surveyorId} onChange={e => setSurveyorId(e.target.value)}>
              {['SRV01','SRV02','SRV03'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">어르신 ID</label>
            <div className="flex gap-2">
              <span className="form-input w-16 text-center bg-gray-50">HC</span>
              <input
                className="form-input flex-1"
                placeholder="01"
                value={elNum}
                onChange={e => setElNum(e.target.value.replace(/\D/g, ''))}
                maxLength={4}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

          <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 관리자 로그인 */}
        <div className="card">
          <button
            className="w-full text-left text-sm text-gray-600 font-medium flex justify-between items-center"
            onClick={() => setAdminOpen(!adminOpen)}
          >
            관리자 로그인
            <span>{adminOpen ? '▲' : '▼'}</span>
          </button>

          {adminOpen && (
            <form onSubmit={handleAdminLogin} className="mt-4 space-y-3">
              <div>
                <label className="form-label">관리자 비밀번호</label>
                <input
                  type="password"
                  className="form-input"
                  value={adminPw}
                  onChange={e => setAdminPw(e.target.value)}
                  placeholder="비밀번호 입력"
                />
              </div>
              {adminError && <p className="text-sm text-red-600">{adminError}</p>}
              <button type="submit" className="btn-secondary w-full">관리자 로그인</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
