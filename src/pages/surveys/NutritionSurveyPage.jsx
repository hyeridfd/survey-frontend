import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import SurveyLayout from '../../components/layout/SurveyLayout'
import { InfoBox, Divider } from '../../components/FormFields'

const TOTAL_PAGES = 3
const DAYS = [1, 2, 3, 4, 5]

// MEAL_FOODS: { 끼니: [{ food: 음식구분, menu: 메뉴명 }] }
// 메뉴명은 실제 식단에 맞게 수정해주세요
const MEAL_FOODS = {
  '아침':  [
    { food: '밥/죽',  menu: '잡곡밥' },
    { food: '국/탕',  menu: '된장국' },
    { food: '주찬',   menu: '고등어구이' },
    { food: '부찬1',  menu: '시금치나물' },
    { food: '부찬2',  menu: '두부조림' },
    { food: '김치',   menu: '배추김치' },
  ],
  '간식1': [
    { food: '간식', menu: '요구르트' },
  ],
  '점심':  [
    { food: '밥/죽',  menu: '백미밥' },
    { food: '국/탕',  menu: '미역국' },
    { food: '주찬',   menu: '돼지불고기' },
    { food: '부찬1',  menu: '콩나물무침' },
    { food: '부찬2',  menu: '감자조림' },
    { food: '김치',   menu: '깍두기' },
  ],
  '간식2': [
    { food: '간식', menu: '바나나' },
  ],
  '저녁':  [
    { food: '밥/죽',  menu: '잡곡밥' },
    { food: '국/탕',  menu: '콩나물국' },
    { food: '주찬',   menu: '닭조림' },
    { food: '부찬1',  menu: '무생채' },
    { food: '부찬2',  menu: '호박볶음' },
    { food: '김치',   menu: '배추김치' },
  ],
}
const MEALS = Object.keys(MEAL_FOODS)

// ── 잔반량 원형 SVG ──
function WasteCircle({ level, size = 40 }) {
  const fills = [
    null,
    'M 50 50 L 50 5 A 45 45 0 0 1 95 50 Z',
    'M 50 50 L 50 5 A 45 45 0 0 1 50 95 Z',
    'M 50 50 L 50 5 A 45 45 0 1 1 5 50 Z',
    null,
  ]
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size, flexShrink: 0 }}>
      <circle cx="50" cy="50" r="45" fill={level === 4 ? '#2c3e50' : 'white'} stroke="#333" strokeWidth="3" />
      {fills[level] && <path d={fills[level]} fill="#2c3e50" />}
    </svg>
  )
}

// ── 그램 입력 (한 줄: 라벨 | 메뉴명 | 숫자입력 | − | +) ──
function GramInput({ label, menu, value, onChange }) {
  const val = value ?? 100
  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
      <div className="w-24 shrink-0">
        <span className="text-sm text-gray-700 font-medium block">{label}</span>
        {menu && <span className="text-xs text-blue-500">{menu}</span>}
      </div>
      <input
        type="number" min={0} step={1} value={val}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <span className="text-xs text-gray-400 shrink-0">g</span>
      <button type="button" onClick={() => onChange(Math.max(0, val - 10))}
        className="w-9 h-9 shrink-0 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-600 font-bold text-lg">−</button>
      <button type="button" onClick={() => onChange(val + 10)}
        className="w-9 h-9 shrink-0 flex items-center justify-center bg-blue-100 hover:bg-blue-200 rounded-lg border border-blue-200 text-blue-700 font-bold text-lg">+</button>
    </div>
  )
}

// ── 잔반 선택 (태블릿/모바일 최적화) ──
function WasteSelector({ label, menu, value, onChange }) {
  const levels = [
    { v: 0, l: '다 먹음' },
    { v: 1, l: '25%' },
    { v: 2, l: '50%' },
    { v: 3, l: '75%' },
    { v: 4, l: '모두' },
  ]
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* 음식 이름 + 메뉴명 */}
      <div className="w-20 shrink-0">
        <span className="text-sm font-medium text-gray-700 block">{label}</span>
        {menu && <span className="text-xs text-blue-500">{menu}</span>}
      </div>
      {/* 잔반량 버튼 5개 */}
      <div className="flex gap-1.5 flex-1">
        {levels.map(opt => (
          <button key={opt.v} type="button" onClick={() => onChange(opt.v)}
            className={`flex flex-col items-center py-1.5 rounded-xl border-2 transition-colors flex-1 ${
              value === opt.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            <WasteCircle level={opt.v} size={32} />
            <span className="text-xs text-gray-500 mt-0.5" style={{fontSize:'10px'}}>{opt.l}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 사진 업로드 박스 (촬영 + 앨범 선택 분리) ──
function PhotoUploader({ day, meal, photoType, label, uploadedUrl, onUploaded, onDeleted }) {
  const cameraRef = useRef(null)   // 카메라 촬영용
  const galleryRef = useRef(null)  // 앨범 선택용
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(uploadedUrl || null)
  const [error, setError] = useState('')

  useEffect(() => { setPreview(uploadedUrl || null) }, [uploadedUrl])

  const handleFile = async (file) => {
    if (!file) return
    setError('')
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
      <p className="text-sm font-semibold text-gray-700 mb-2 text-center">{label}</p>

      {preview ? (
        <div className="relative">
          <img src={preview} alt={label}
            className="w-full h-36 object-cover rounded-xl border border-gray-200" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-medium">업로드 중...</span>
            </div>
          )}
          {!uploading && (
            <>
              <button type="button" onClick={handleDelete}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600 shadow">
                ✕
              </button>
              {/* 재촬영/재선택 버튼 */}
              <div className="absolute bottom-2 left-0 right-0 flex gap-1 justify-center px-2">
                <button type="button" onClick={() => cameraRef.current?.click()}
                  className="flex-1 bg-black/60 text-white text-xs py-1 rounded-lg hover:bg-black/80">
                  📷 재촬영
                </button>
                <button type="button" onClick={() => galleryRef.current?.click()}
                  className="flex-1 bg-black/60 text-white text-xs py-1 rounded-lg hover:bg-black/80">
                  🖼 앨범
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className={`w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? (
            <div className="h-36 flex items-center justify-center">
              <span className="text-sm text-gray-400">업로드 중...</span>
            </div>
          ) : (
            <>
              {/* 촬영 버튼 */}
              <button type="button" onClick={() => cameraRef.current?.click()}
                disabled={uploading}
                className="w-full py-4 flex flex-col items-center gap-1 hover:bg-blue-50 transition-colors border-b border-gray-200">
                <span className="text-2xl">📷</span>
                <span className="text-sm font-medium text-blue-600">사진 촬영</span>
              </button>
              {/* 앨범 선택 버튼 */}
              <button type="button" onClick={() => galleryRef.current?.click()}
                disabled={uploading}
                className="w-full py-4 flex flex-col items-center gap-1 hover:bg-green-50 transition-colors">
                <span className="text-2xl">🖼️</span>
                <span className="text-sm font-medium text-green-600">앨범에서 선택</span>
              </button>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1 text-center">{error}</p>}

      {/* 카메라 촬영 전용 input */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />

      {/* 앨범 선택 전용 input (capture 없음) */}
      <input ref={galleryRef} type="file" accept="image/*"
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
  const [activeMeal, setActiveMeal] = useState('아침')
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
    if (page < TOTAL_PAGES) { setPage(p => p + 1); setActiveDay(1); setActiveMeal('아침'); window.scrollTo(0, 0) }
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

  const countPhotos = (day) =>
    MEALS.reduce((n, meal) => {
      if (photos[photoKey(day, meal, 'before')]?.url) n++
      if (photos[photoKey(day, meal, 'after')]?.url) n++
      return n
    }, 0)

  // 일차 탭
  const DayTabs = ({ showPhotoCount = false }) => (
    <div className="flex gap-2 mb-4 flex-wrap">
      {DAYS.map(d => {
        const cnt = showPhotoCount ? countPhotos(d) : null
        const total = MEALS.length * 2
        return (
          <button key={d} type="button" onClick={() => setActiveDay(d)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeDay === d ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {d}일차
            {showPhotoCount && (
              <span className={`ml-1.5 text-xs ${activeDay === d ? 'text-blue-100' : cnt === total ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
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
          <h2 className="section-title">끼니별 음식 배식량 입력</h2>
          <InfoBox>📝 5일 동안 각 끼니에서 제공한 음식의 무게(g)를 입력해주세요.</InfoBox>

          {/* 일차 탭 */}
          <DayTabs />

          {/* 끼니 탭 */}
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {MEALS.map(meal => (
              <button key={meal} type="button"
                onClick={() => setActiveMeal(meal)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeMeal === meal ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{meal}</button>
            ))}
          </div>

          {/* 선택된 끼니의 음식 목록 - 세로로 한 페이지에 */}
          <div className="bg-gray-50 rounded-xl px-4 py-2">
            <p className="text-xs text-gray-400 mb-1 pt-2">{activeDay}일차 · {activeMeal}</p>
            {MEAL_FOODS[activeMeal].map(({ food, menu }) => (
              <GramInput key={food} label={food} menu={menu}
                value={getGram(activeDay, activeMeal, food)}
                onChange={v => setGram(activeDay, activeMeal, food, v)} />
            ))}
          </div>
        </div>
      )}

      {/* ── 2페이지: 잔반량 + 사진 ── */}
      {page === 2 && (
        <div>
          <h2 className="section-title">음식별 잔반량 + 식사 사진</h2>
          <InfoBox>
            ① 원형 그림으로 잔반량을 선택하고<br />
            ② 각 끼니의 <strong>식전·식후 사진</strong>을 업로드해주세요.
          </InfoBox>

          {/* 잔반 범례 */}
          <div className="flex justify-around mb-4 p-3 bg-gray-50 rounded-xl">
            {[{l:0,t:'다 먹음'},{l:1,t:'25%'},{l:2,t:'50%'},{l:3,t:'75%'},{l:4,t:'모두'}].map(item => (
              <div key={item.l} className="text-center">
                <WasteCircle level={item.l} size={44} />
                <p className="text-xs text-gray-500 mt-1">{item.t}</p>
              </div>
            ))}
          </div>

          <DayTabs showPhotoCount />

          {MEALS.map(meal => (
            <div key={meal} className="mb-6 border border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
              <h3 className="text-base font-bold text-blue-700 mb-4 border-b border-blue-100 pb-2">{meal}</h3>

              {/* 잔반량 - 음식명 왼쪽, 선택 버튼 오른쪽 */}
              <div className="mb-5 bg-gray-50 rounded-xl px-3 py-1">
                {MEAL_FOODS[meal].map(({ food, menu }) => (
                  <WasteSelector key={food} label={food} menu={menu}
                    value={getWaste(activeDay, meal, food)}
                    onChange={v => setWaste(activeDay, meal, food, v)} />
                ))}
              </div>

              {/* 식전 / 식후 사진 - 나란히 배치 */}
              <div className="grid grid-cols-2 gap-3">
                {['before', 'after'].map(type => (
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
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">📸 사진 업로드 현황</p>
            <div className="grid grid-cols-5 gap-2">
              {DAYS.map(d => {
                const cnt = countPhotos(d)
                const total = MEALS.length * 2
                const done = cnt === total
                return (
                  <div key={d} className={`text-center p-3 rounded-xl border-2 ${done ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <p className="text-xs font-medium text-gray-600">{d}일차</p>
                    <p className={`text-xl font-bold mt-1 ${done ? 'text-green-600' : 'text-gray-400'}`}>{cnt}</p>
                    <p className="text-xs text-gray-400">/{total}장</p>
                  </div>
                )
              })}
            </div>
          </div>
          <Divider label="저장" />
          <InfoBox type="success">
            ✅ 제출 버튼을 눌러 저장하세요.<br/>
          </InfoBox>
        </div>
      )}

    </SurveyLayout>
  )
}