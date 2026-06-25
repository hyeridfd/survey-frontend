import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import SurveyLayout from '../../components/layout/SurveyLayout'
import { InfoBox, Divider } from '../../components/FormFields'

const TOTAL_PAGES = 3
const DAYS = [1, 2, 3, 4, 5]

const MEAL_FOODS = {
  '아침':  ['밥/죽', '국/탕', '주찬', '부찬1', '부찬2', '김치'],
  '간식1': ['간식'],
  '점심':  ['밥/죽', '국/탕', '주찬', '부찬1', '부찬2', '김치'],
  '간식2': ['간식'],
  '저녁':  ['밥/죽', '국/탕', '주찬', '부찬1', '부찬2', '김치'],
}
const MEALS = Object.keys(MEAL_FOODS)

// ── 잔반량 원형 SVG ──
function WasteCircle({ level, size = 56 }) {
  const fills = [
    null,
    'M 50 50 L 50 5 A 45 45 0 0 1 95 50 Z',
    'M 50 50 L 50 5 A 45 45 0 0 1 50 95 Z',
    'M 50 50 L 50 5 A 45 45 0 1 1 5 50 Z',
    null,
  ]
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
      <circle cx="50" cy="50" r="45" fill={level === 4 ? '#2c3e50' : 'white'} stroke="#333" strokeWidth="2" />
      {fills[level] && <path d={fills[level]} fill="#2c3e50" />}
    </svg>
  )
}

// ── 그램 입력 ──
function GramInput({ label, value, onChange }) {
  const val = value ?? 100
  return (
    <div className="mb-3">
      <p className="text-xs text-gray-500 mb-1">{label} (g)</p>
      <div className="flex items-center gap-1">
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm font-medium text-gray-700 py-2">
          {Number(val).toFixed(2)}
        </div>
        <button type="button" onClick={() => onChange(Math.max(0, val - 10))}
          className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-600 font-bold text-lg">−</button>
        <button type="button" onClick={() => onChange(val + 10)}
          className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-600 font-bold text-lg">+</button>
      </div>
      <input type="number" min={0} step={1} value={val}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full text-xs border border-gray-200 rounded px-2 py-1 text-gray-500 bg-white"
        placeholder="직접 입력" />
    </div>
  )
}

// ── 잔반 선택 ──
function WasteSelector({ label, value, onChange }) {
  const levels = [
    { v: 0, l: '다 먹음' }, { v: 1, l: '25%' },
    { v: 2, l: '50%' }, { v: 3, l: '75%' }, { v: 4, l: '모두' },
  ]
  return (
    <div className="mb-3">
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      <div className="flex gap-1.5">
        {levels.map(opt => (
          <button key={opt.v} type="button" onClick={() => onChange(opt.v)}
            className={`flex flex-col items-center p-1 rounded-lg border-2 transition-colors flex-1 ${
              value === opt.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
            <WasteCircle level={opt.v} size={36} />
            <span className="text-xs text-gray-500 mt-0.5">{opt.l}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 사진 업로드 박스 ──
function PhotoUploader({ day, meal, photoType, label, uploadedUrl, onUploaded, onDeleted }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(uploadedUrl || null)
  const [error, setError] = useState('')

  // 부모에서 url이 바뀌면 preview 동기화
  useEffect(() => { setPreview(uploadedUrl || null) }, [uploadedUrl])

  const handleFile = async (file) => {
    if (!file) return
    setError('')
    // 로컬 미리보기
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const form = new FormData()
      form.append('day', day)
      form.append('meal', meal)
      form.append('photo_type', photoType)
      form.append('file', file)
      const res = await api.post('/surveys/nutrition/upload-photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onUploaded(res.data.public_url, res.data.file_name)
    } catch (e) {
      setError(e.response?.data?.detail || '업로드 실패')
      setPreview(uploadedUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('사진을 삭제하시겠습니까?')) return
    try {
      const fileName = uploadedUrl?.split('/').pop()
      if (fileName) await api.delete(`/surveys/nutrition/delete-photo?file_name=${encodeURIComponent(fileName)}`)
      setPreview(null)
      onDeleted()
    } catch (e) {
      setError('삭제 실패: ' + (e.response?.data?.detail || e.message))
    }
  }

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-600 mb-1 text-center">{label}</p>

      {preview ? (
        <div className="relative">
          <img src={preview} alt={label}
            className="w-full h-28 object-cover rounded-lg border border-gray-200" />
          {/* 업로드 중 오버레이 */}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">업로드 중...</span>
            </div>
          )}
          {/* 삭제 버튼 */}
          {!uploading && (
            <button type="button" onClick={handleDelete}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
              ✕
            </button>
          )}
          {/* 재선택 */}
          {!uploading && (
            <button type="button" onClick={() => inputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded hover:bg-black/70">
              변경
            </button>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50">
          {uploading
            ? <span className="text-xs text-gray-400">업로드 중...</span>
            : <>
                <span className="text-2xl">📷</span>
                <span className="text-xs text-gray-400">{label} 사진</span>
                <span className="text-xs text-blue-500">탭하여 선택</span>
              </>
          }
        </button>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  )
}

// ── 메인 컴포넌트 ──
export default function NutritionSurveyPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [data, setData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mealPortions, setMealPortions] = useState({})
  const [plateWaste, setPlateWaste] = useState({})
  const [activeDay, setActiveDay] = useState(1)

  // photos: { 'day1_아침_before': { url, fileName }, 'day1_아침_after': {...}, ... }
  const [photos, setPhotos] = useState({})

  useEffect(() => {
    api.get('/surveys/nutrition').then(r => {
      const d = r.data
      if (d && Object.keys(d).length > 0) {
        setData(d)
        try {
          if (d.meal_portions) setMealPortions(typeof d.meal_portions === 'string' ? JSON.parse(d.meal_portions) : d.meal_portions)
          if (d.plate_waste)   setPlateWaste(typeof d.plate_waste === 'string' ? JSON.parse(d.plate_waste) : d.plate_waste)
          if (d.photos)        setPhotos(typeof d.photos === 'string' ? JSON.parse(d.photos) : d.photos)
        } catch {}
      }
    })
  }, [])

  const photoKey = (day, meal, type) => `day${day}_${meal}_${type}`

  const getGram = (day, meal, food) => mealPortions[`day${day}`]?.[meal]?.[food] ?? 100
  const setGram = (day, meal, food, val) =>
    setMealPortions(prev => ({ ...prev, [`day${day}`]: { ...(prev[`day${day}`] || {}), [meal]: { ...(prev[`day${day}`]?.[meal] || {}), [food]: val } } }))

  const getWaste = (day, meal, food) => plateWaste[`day${day}`]?.[meal]?.[food] ?? 0
  const setWaste = (day, meal, food, val) =>
    setPlateWaste(prev => ({ ...prev, [`day${day}`]: { ...(prev[`day${day}`] || {}), [meal]: { ...(prev[`day${day}`]?.[meal] || {}), [food]: val } } }))

  const handleNext = async () => {
    if (page < TOTAL_PAGES) { setPage(p => p + 1); setActiveDay(1); window.scrollTo(0, 0) }
    else await handleSubmit()
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await api.post('/surveys/nutrition', {
        data: { ...data, meal_portions: mealPortions, plate_waste: plateWaste, photos }
      })
      setSaved(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (e) {
      alert('저장 중 오류: ' + (e.response?.data?.detail || e.message))
    } finally { setSaving(false) }
  }

  if (saved) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card text-center p-10">
        <div className="text-5xl mb-4">✅</div>
        <p className="text-lg font-semibold">영양 조사표가 저장되었습니다!</p>
        <p className="text-sm text-gray-500 mt-2">대시보드로 이동합니다...</p>
      </div>
    </div>
  )

  // 이 일차·끼니의 사진 업로드 완료 수
  const countPhotos = (day) =>
    MEALS.reduce((n, meal) => {
      if (photos[photoKey(day, meal, 'before')]?.url) n++
      if (photos[photoKey(day, meal, 'after')]?.url) n++
      return n
    }, 0)

  const DayTabs = ({ showPhotoCount = false }) => (
    <div className="flex gap-1.5 mb-4 flex-wrap">
      {DAYS.map(d => {
        const cnt = showPhotoCount ? countPhotos(d) : null
        const total = MEALS.length * 2
        return (
          <button key={d} type="button" onClick={() => setActiveDay(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative ${
              activeDay === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {d}일차
            {showPhotoCount && (
              <span className={`ml-1 text-xs ${activeDay === d ? 'text-blue-100' : cnt === total ? 'text-green-600' : 'text-gray-400'}`}>
                {cnt}/{total}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )

  return (
    <SurveyLayout
      title="영양 조사표" icon="🥗"
      page={page} totalPages={TOTAL_PAGES}
      onPrev={() => { setPage(p => p - 1); setActiveDay(1); window.scrollTo(0,0) }}
      onNext={handleNext}
      onDashboard={() => navigate('/dashboard')}
      nextLabel={saving ? '저장 중...' : undefined}
    >

      {/* ── 1페이지: 섭취량 ── */}
      {page === 1 && (
        <div>
          <h2 className="section-title">끼니별 음식 섭취량 입력</h2>
          <InfoBox>📝 5일 동안 각 끼니에서 실제로 드신 음식의 양(g)을 입력해주세요.</InfoBox>
          <DayTabs />
          <div className="overflow-x-auto">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${MEALS.length}, minmax(140px, 1fr))`, minWidth: `${MEALS.length * 148}px` }}>
              {MEALS.map(meal => (
                <div key={meal}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center bg-blue-50 py-1.5 rounded-lg">{meal}</h3>
                  {MEAL_FOODS[meal].map(food => (
                    <GramInput key={food} label={food}
                      value={getGram(activeDay, meal, food)}
                      onChange={v => setGram(activeDay, meal, food, v)} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 2페이지: 잔반량 + 사진 업로드 ── */}
      {page === 2 && (
        <div>
          <h2 className="section-title">음식별 잔반량 + 식사 사진</h2>
          <InfoBox>
            ① 원형 그림으로 잔반량을 선택하고<br />
            ② 각 끼니의 <strong>식전·식후 사진</strong>을 업로드해주세요.
          </InfoBox>

          {/* 잔반 범례 */}
          <div className="flex justify-around mb-4 p-3 bg-gray-50 rounded-lg">
            {[{l:0,t:'다 먹음'},{l:1,t:'25%'},{l:2,t:'50%'},{l:3,t:'75%'},{l:4,t:'모두'}].map(item => (
              <div key={item.l} className="text-center">
                <WasteCircle level={item.l} size={40} />
                <p className="text-xs text-gray-500 mt-1">{item.t}</p>
              </div>
            ))}
          </div>

          <DayTabs showPhotoCount />

          {MEALS.map(meal => (
            <div key={meal} className="mb-6 border border-gray-100 rounded-xl p-3">
              <h3 className="text-sm font-semibold text-blue-700 mb-3 border-b border-blue-100 pb-1">{meal}</h3>

              {/* 잔반량 선택 */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {MEAL_FOODS[meal].map(food => (
                  <WasteSelector key={food} label={food}
                    value={getWaste(activeDay, meal, food)}
                    onChange={v => setWaste(activeDay, meal, food, v)} />
                ))}
              </div>

              {/* 식전 / 식후 사진 업로드 */}
              <div className="flex gap-3">
                {['before','after'].map(type => (
                  <PhotoUploader
                    key={type}
                    day={activeDay}
                    meal={meal}
                    photoType={type}
                    label={type === 'before' ? '🍽️ 식전' : '🥣 식후'}
                    uploadedUrl={photos[photoKey(activeDay, meal, type)]?.url}
                    onUploaded={(url, fileName) =>
                      setPhotos(prev => ({ ...prev, [photoKey(activeDay, meal, type)]: { url, fileName } }))
                    }
                    onDeleted={() =>
                      setPhotos(prev => { const n = {...prev}; delete n[photoKey(activeDay, meal, type)]; return n })
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 3페이지: 최종 확인 ── */}
      {page === 3 && (
        <div>
          <h2 className="section-title">최종 확인</h2>

          {/* 사진 업로드 현황 요약 */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">📸 사진 업로드 현황</p>
            <div className="grid grid-cols-5 gap-2">
              {DAYS.map(d => {
                const cnt = countPhotos(d)
                const total = MEALS.length * 2
                const done = cnt === total
                return (
                  <div key={d} className={`text-center p-2 rounded-lg border ${done ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <p className="text-xs font-medium text-gray-600">{d}일차</p>
                    <p className={`text-lg font-bold ${done ? 'text-green-600' : 'text-gray-400'}`}>{cnt}</p>
                    <p className="text-xs text-gray-400">/{total}장</p>
                  </div>
                )
              })}
            </div>
          </div>

          <Divider label="저장" />
          <InfoBox type="success">
            ✅ 1~2페이지 입력이 완료되었습니다.<br />
            사진을 모두 올리지 않아도 저장할 수 있습니다.
          </InfoBox>
        </div>
      )}

    </SurveyLayout>
  )
}