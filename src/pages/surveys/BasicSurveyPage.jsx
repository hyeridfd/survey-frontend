import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import SurveyLayout from '../../components/layout/SurveyLayout'
import { RadioGroup, SelectField, NumberField, CheckboxGroup, InfoBox, Divider } from '../../components/FormFields'

const TOTAL_PAGES = 9

const DISEASE_OPTIONS = [
  '없음','고혈압','당뇨병','고지혈증','심혈관 질환(심근경색, 협심증, 부정맥 등)',
  '뇌혈관 질환(뇌졸중, 뇌경색, 뇌출혈 등)','갑상선 질환','골다공증','골관절염/류마티스 관절염',
  '암','만성 폐쇄성 폐질환','신장 질환','간 질환','위장 질환','빈혈','치매',
  '파킨슨병','우울증','기타'
]

const MEDICATION_OPTIONS = [
  '복용하지 않음','고혈압약','당뇨병약','고지혈증약','항혈전제','심장약',
  '갑상선약','골다공증약','진통소염제','항암제','천식약',
  '신장약','간약','위장약','철분제','치매약','파킨슨약','항우울제','기타'
]

// K-MBI 항목 설정 (Streamlit과 동일)
const KMBI_OPTIONS_BASE = ['과제를 수행할 수 없는 경우','최대의 도움이 필요한 경우','중등도의 도움이 필요한 경우','최소한의 도움이 필요하거나 감시가 필요한 경우','완전히 독립적인 경우']
const KMBI_OPTIONS_NA = ['해당 사항 없음',...KMBI_OPTIONS_BASE]
const KMBI_ITEMS = [
  { id:'kmbi_1', label:'개인위생', desc:'세수, 머리 빗기, 칫솔질, 면도 등', options:KMBI_OPTIONS_BASE, scores:[0,1,3,4,5] },
  { id:'kmbi_2', label:'목욕하기', desc:'목욕 또는 샤워', options:KMBI_OPTIONS_BASE, scores:[0,1,3,4,5] },
  { id:'kmbi_3', label:'식사하기', desc:'음식을 먹는 동작', options:KMBI_OPTIONS_BASE, scores:[0,2,5,8,10] },
  { id:'kmbi_4', label:'용변처리', desc:'화장실 사용 및 뒤처리', options:KMBI_OPTIONS_BASE, scores:[0,2,5,8,10] },
  { id:'kmbi_5', label:'계단 오르기', desc:'계단 오르고 내리기', options:KMBI_OPTIONS_BASE, scores:[0,2,5,8,10] },
  { id:'kmbi_6', label:'옷 입기', desc:'옷과 신발 착용', options:KMBI_OPTIONS_BASE, scores:[0,2,5,8,10] },
  { id:'kmbi_7', label:'대변조절', desc:'대변 조절 능력', options:KMBI_OPTIONS_BASE, scores:[0,2,5,8,10] },
  { id:'kmbi_8', label:'소변조절', desc:'소변 조절 능력', options:KMBI_OPTIONS_BASE, scores:[0,2,5,8,10] },
  { id:'kmbi_9', label:'보행', desc:'실내외 이동', isWalk:true, options:KMBI_OPTIONS_NA, scores:[0,0,3,8,12,15] },
  { id:'kmbi_10', label:'의자차(휠체어)', desc:'휠체어 사용', isWheelchair:true, options:KMBI_OPTIONS_NA, scores:[0,0,1,3,4,5] },
  { id:'kmbi_11', label:'의자/침대 이동', desc:'의자나 침대로의 이동', options:KMBI_OPTIONS_BASE, scores:[0,3,8,12,15] },
]

// MMSE 항목
const MMSE_ITEMS = [
  { key: 'mmse_time_year', label: '올해는 몇 년도입니까?' },
  { key: 'mmse_time_month', label: '지금은 몇 월입니까?' },
  { key: 'mmse_time_day', label: '오늘은 며칠입니까?' },
  { key: 'mmse_time_weekday', label: '오늘은 무슨 요일입니까?' },
  { key: 'mmse_time_season', label: '지금은 어느 계절입니까?' },
  { key: 'mmse_place_country', label: '여기는 어느 나라입니까?' },
  { key: 'mmse_place_city', label: '여기는 어느 시/도입니까?' },
  { key: 'mmse_place_type', label: '여기는 어떤 곳입니까? (예: 병원, 요양원)' },
  { key: 'mmse_place_name', label: '이곳의 이름이 무엇입니까?' },
  { key: 'mmse_place_floor', label: '지금 몇 층에 있습니까?' },
  { key: 'mmse_reg_airplane', label: '기억등록: 비행기' },
  { key: 'mmse_reg_pencil', label: '기억등록: 연필' },
  { key: 'mmse_reg_pine', label: '기억등록: 소나무' },
  { key: 'mmse_recall_airplane', label: '기억회상: 비행기' },
  { key: 'mmse_recall_pencil', label: '기억회상: 연필' },
  { key: 'mmse_recall_pine', label: '기억회상: 소나무' },
  { key: 'mmse_calc_1', label: '100-7=?' },
  { key: 'mmse_calc_2', label: '93-7=?' },
  { key: 'mmse_calc_3', label: '86-7=?' },
  { key: 'mmse_calc_4', label: '79-7=?' },
  { key: 'mmse_calc_5', label: '72-7=?' },
  { key: 'mmse_naming', label: '이름 대기 (2점)' },
  { key: 'mmse_repetition', label: '따라 말하기 (1점)' },
  { key: 'mmse_comprehension', label: '3단계 명령 (3점)' },
  { key: 'mmse_reading', label: '읽기 (1점)' },
  { key: 'mmse_writing', label: '쓰기 (1점)' },
  { key: 'mmse_drawing', label: '도형 그리기 (1점)' },
]

export default function BasicSurveyPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [data, setData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/surveys/basic').then(r => { if (r.data && Object.keys(r.data).length > 0) setData(r.data) })
  }, [])

  const update = (fields) => setData(prev => ({ ...prev, ...fields }))

  const handleNext = async () => {
    if (page < TOTAL_PAGES) { setPage(p => p + 1); window.scrollTo(0,0) }
    else await handleSubmit()
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await api.post('/surveys/basic', { data })
      setSaved(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (e) {
      alert('저장 중 오류가 발생했습니다: ' + (e.response?.data?.detail || e.message))
    } finally { setSaving(false) }
  }

  const goToDashboard = () => navigate('/dashboard')

  if (saved) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card text-center p-10">
        <div className="text-5xl mb-4">✅</div>
        <p className="text-lg font-semibold text-gray-800">기초 조사표가 저장되었습니다!</p>
        <p className="text-sm text-gray-500 mt-2">대시보드로 이동합니다...</p>
      </div>
    </div>
  )

  const bmi = data.height && data.weight
    ? (data.weight / Math.pow(data.height / 100, 2)).toFixed(1)
    : null

  // 신체활동 MET 계산
  const totalMet = (
    (data.vigorous_activity_days || 0) * (data.vigorous_activity_time || 0) * 8.0 +
    (data.moderate_activity_days || 0) * (data.moderate_activity_time || 0) * 4.0 +
    (data.walking_days || 0) * (data.walking_time || 0) * 3.3
  )
  // Streamlit과 동일한 IPAQ-SF 분류 기준
  const vDays = data.vigorous_activity_days || 0
  const vTime = data.vigorous_activity_time || 0
  const mDays = data.moderate_activity_days || 0
  const wDays = data.walking_days || 0
  const totalVigorousMet = vDays * vTime * 8.0
  const totalModerateMet = (data.moderate_activity_days||0) * (data.moderate_activity_time||0) * 4.0
  const activityLevel =
    (totalMet >= 3000 || (vDays >= 3 && totalVigorousMet >= 1500))
      ? '높은 신체 활동 (High)'
      : (totalMet >= 600 || vDays >= 3 || (mDays + wDays >= 5 && totalModerateMet + (data.walking_days||0)*(data.walking_time||0)*3.3 >= 600))
      ? '중간 수준의 신체 활동 (Moderate)'
      : '낮은 신체 활동 (Low)'

  // K-MBI 점수 (Streamlit과 동일 - 보행/의자차 중 하나만 반영, 인덱스로 저장)
  const getKmbiScore = (itemId) => {
    const item = KMBI_ITEMS.find(i => i.id === itemId)
    if (!item) return 0
    const idx = data[itemId]
    if (idx === undefined || idx === null || idx === '') return 0
    return item.scores[Number(idx)] ?? 0
  }
  const walkScore = getKmbiScore('kmbi_9')
  const wheelScore = getKmbiScore('kmbi_10')
  const baseScore = KMBI_ITEMS.filter(i => i.id !== 'kmbi_9' && i.id !== 'kmbi_10').reduce((s, item) => s + getKmbiScore(item.id), 0)
  const kmbiScore = walkScore > 0 ? baseScore + walkScore : wheelScore > 0 ? baseScore + wheelScore : baseScore
  const kmbiMaxScore = walkScore > 0 ? 100 : wheelScore > 0 ? 90 : 100
  const mobilityType = walkScore > 0 ? '보행' : wheelScore > 0 ? '의자차(휠체어)' : '미선택'
  const kmbiPct = kmbiMaxScore > 0 ? (kmbiScore / kmbiMaxScore * 100) : 0
  const kmbiStatusArr = kmbiPct >= 91 ? ['최소 의존(minimal)', '🟢'] : kmbiPct >= 75 ? ['경도 의존(mild)', '🟡'] : kmbiPct >= 50 ? ['중간 의존(moderate)', '🟠'] : kmbiPct >= 25 ? ['대부분 의존(substantial)', '🔴'] : ['완전 의존(full)', '⚫']
  const [kmbiStatus, kmbiEmoji] = kmbiStatusArr

  // MMSE 점수
  const mmseScore = MMSE_ITEMS.reduce((sum, item) => sum + (data[item.key] ? 1 : 0), 0)

  // MNA 점수
  const mnaScore = [
    data.mna_appetite_change, data.mna_weight_change, data.mna_mobility,
    data.mna_stress_illness, data.mna_neuropsychological_problem, data.mna_bmi_category
  ].reduce((s, v) => s + (Number(v) || 0), 0)

  return (
    <SurveyLayout
      title="기초 조사표 (건강설문)"
      icon="📝"
      page={page}
      totalPages={TOTAL_PAGES}
      onPrev={() => { setPage(p => p - 1); window.scrollTo(0,0) }}
      onNext={handleNext}
      onDashboard={goToDashboard}
      nextLabel={saving ? '저장 중...' : undefined}
    >
      {/* ── 1페이지: 인구통계 ── */}
      {page === 1 && (
        <div>
          <h2 className="section-title">인구통계학적 특성</h2>
          <RadioGroup label="1. 귀하의 성별은 선택해 주십시오" options={['남자','여자']} value={data.gender} onChange={v => update({gender:v})} horizontal />
          <NumberField label="2. 귀하의 출생연도를 작성해 주십시오" value={data.age} onChange={v => update({age:v})} min={1900} max={2010} />
          <SelectField label="3. 장기요양등급" options={['1등급','2등급','3등급','4등급 이상']} value={data.care_grade} onChange={v => update({care_grade:v})} />
          <SelectField label="4. 현재 요양시설 거주 기간" options={['1년 미만','1년 이상 ~ 3년 미만','3년 이상 ~ 5년 미만','5년 이상 ~ 10년 미만','10년 이상']} value={data.residence_duration} onChange={v => update({residence_duration:v})} />
          <SelectField label="5. 최종 학력" options={['무학','초등학교 졸업','중학교 졸업','고등학교 졸업','대학교(전문대 포함) 졸업 이상']} value={data.education} onChange={v => update({education:v})} />
          <SelectField label="6. 음주 및 흡연 여부" options={['둘 다 안함','과거에 음주를 했음','과거에 흡연을 했음','현재 음주하고 있음','현재 흡연하고 있음','둘 다 하고 있음']} value={data.drinking_smoking} onChange={v => update({drinking_smoking:v})} />
        </div>
      )}

      {/* ── 2페이지: 질환 ── */}
      {page === 2 && (
        <div>
          <h2 className="section-title">질환 정보</h2>
          <CheckboxGroup label="7. 현재 보유하신 질환을 모두 선택해 주십시오" options={DISEASE_OPTIONS} value={data.diseases || []} onChange={v => update({diseases:v})} />
          <Divider />
          <CheckboxGroup label="8. 현재 복용 중인 약물 (복수 선택 가능)" options={MEDICATION_OPTIONS} value={data.medications || []} onChange={v => update({medications:v})} />
          <SelectField label="9. 약물 복용 개수" options={['1개','2개','3개','4개 이상']} value={data.medication_count} onChange={v => update({medication_count:v})} />
        </div>
      )}

      {/* ── 3페이지: 식사 ── */}
      {page === 3 && (
        <div>
          <h2 className="section-title">식사 관련 특성</h2>
          <RadioGroup label="10. 음식을 씹는 데 어려움이 있습니까?" options={['예','아니오']} value={data.chewing_difficulty === true ? '예' : data.chewing_difficulty === false ? '아니오' : undefined} onChange={v => update({chewing_difficulty: v === '예'})} horizontal />
          <RadioGroup label="11. 음식을 삼키는 데 어려움이 있습니까?" options={['예','아니오']} value={data.swallowing_difficulty === true ? '예' : data.swallowing_difficulty === false ? '아니오' : undefined} onChange={v => update({swallowing_difficulty: v === '예'})} horizontal />
          <SelectField label="12. 음식 섭취 방법" options={['어렵지 않음','일반식','잘게 썬 음식','갈은 음식','믹서 음식(유동식)','기타']} value={data.food_preparation_method} onChange={v => update({food_preparation_method:v})} />
          <SelectField label="13. 평소 식사 방법" options={['스스로 식사할 수 있음','요양보호사 등의 부분적인 도움 필요','요양보호사 등의 전적인 도움 필요']} value={data.eating_independence} onChange={v => update({eating_independence:v})} />
          <SelectField label="14. 식사 형태" options={['일반식','다진식','연하식','기타']} value={data.meal_type} onChange={v => update({meal_type:v})} />
        </div>
      )}

      {/* ── 4페이지: 건강 측정치 ── */}
      {page === 4 && (
        <div>
          <h2 className="section-title">기본 건강 측정치</h2>
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="15. 신장" value={data.height} onChange={v => update({height:v})} unit="cm" min={0} max={250} step={0.1} />
            <NumberField label="16. 체중" value={data.weight} onChange={v => update({weight:v})} unit="kg" min={0} max={200} step={0.1} />
            <NumberField label="17. 허리둘레" value={data.waist_circumference} onChange={v => update({waist_circumference:v})} unit="cm" min={0} max={200} step={0.1} />
            <div>
              {bmi && <InfoBox>BMI: <strong>{bmi}</strong> kg/m²</InfoBox>}
            </div>
            <NumberField label="18. 수축기 혈압" value={data.systolic_bp} onChange={v => update({systolic_bp:v})} unit="mmHg" min={0} max={300} />
            <NumberField label="19. 이완기 혈압" value={data.diastolic_bp} onChange={v => update({diastolic_bp:v})} unit="mmHg" min={0} max={200} />
          </div>
        </div>
      )}

      {/* ── 5페이지: IPAQ-SF ── */}
      {page === 5 && (
        <div>
          <h2 className="section-title">신체 활동 수준 조사 (IPAQ-SF)</h2>
          <InfoBox>📝 지난 7일 동안의 신체 활동에 대해 응답해주세요.</InfoBox>

          {/* 1. 격렬한 신체 활동 */}
          <div className="mb-5">
            <p className="font-semibold text-gray-800 mb-1">1. 격렬한 신체 활동</p>
            <p className="text-xs text-gray-400 mb-3">예: 무거운 물건 들기, 땅 파기, 에어로빅, 빠른 속도로 자전거 타기 등</p>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="지난 7일 동안 격렬한 신체 활동을 10분 이상 한 날은 며칠입니까?"
                value={data.vigorous_activity_days}
                onChange={v => update({vigorous_activity_days:v})}
                unit="일" min={0} max={7} />
              <NumberField
                label="그러한 날 중 하루에 보통 얼마나 많은 시간을 격렬한 신체 활동을 하는데 보냈습니까?"
                value={data.vigorous_activity_time}
                onChange={v => update({vigorous_activity_time:v})}
                unit="분" min={0} max={1440} />
            </div>
          </div>

          <Divider />

          {/* 2. 중간 정도 신체 활동 */}
          <div className="mb-5">
            <p className="font-semibold text-gray-800 mb-1">2. 중간 정도의 신체 활동</p>
            <p className="text-xs text-gray-400 mb-3">예: 가벼운 물건 나르기, 보통 속도로 자전거 타기, 복식 테니스 등 (걷기는 제외)</p>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="지난 7일 동안 중간 정도의 신체 활동을 10분 이상 한 날은 며칠입니까?"
                value={data.moderate_activity_days}
                onChange={v => update({moderate_activity_days:v})}
                unit="일" min={0} max={7} />
              <NumberField
                label="그러한 날 중 하루에 보통 얼마나 많은 시간을 중간 정도의 신체 활동을 하는데 보냈습니까?"
                value={data.moderate_activity_time}
                onChange={v => update({moderate_activity_time:v})}
                unit="분" min={0} max={1440} />
            </div>
          </div>

          <Divider />

          {/* 3. 걷기 */}
          <div className="mb-5">
            <p className="font-semibold text-gray-800 mb-1">3. 걷기</p>
            <p className="text-xs text-gray-400 mb-3">직장에서, 집에서, 장소 간 이동, 여가 시간의 모든 걷기를 포함</p>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="지난 7일 동안 10분 이상 걸은 날은 며칠입니까?"
                value={data.walking_days}
                onChange={v => update({walking_days:v})}
                unit="일" min={0} max={7} />
              <NumberField
                label="그러한 날 중 하루에 보통 얼마나 많은 시간을 걷는데 보냈습니까?"
                value={data.walking_time}
                onChange={v => update({walking_time:v})}
                unit="분" min={0} max={1440} />
            </div>
          </div>

          <Divider />

          {/* 4. 앉아서 보낸 시간 */}
          <div className="mb-5">
            <p className="font-semibold text-gray-800 mb-1">4. 앉아서 보낸 시간</p>
            <p className="text-xs text-gray-400 mb-3">책상에 앉아 있거나, 친구를 만나거나, 독서할 때 앉거나, 텔레비전을 앉아서 또는 누워서 시청한 시간이 포함</p>
            <NumberField
              label="지난 7일 동안 평일 하루에 앉아서 보낸 시간은 얼마나 됩니까?"
              value={data.sitting_time}
              onChange={v => update({sitting_time:v})}
              unit="분" min={0} max={1440} />
          </div>

          {/* 활동량 요약 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
            <p className="text-sm font-semibold text-blue-800 mb-3">📊 신체 활동량 요약</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                ['격렬한 활동', ((data.vigorous_activity_days||0)*(data.vigorous_activity_time||0)*8.0).toFixed(2)],
                ['중간 활동', ((data.moderate_activity_days||0)*(data.moderate_activity_time||0)*4.0).toFixed(2)],
                ['걷기', ((data.walking_days||0)*(data.walking_time||0)*3.3).toFixed(2)],
                ['총 활동량', totalMet.toFixed(2)],
              ].map(([label, val]) => (
                <div key={label} className="bg-white rounded-lg p-2.5 text-center">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-bold text-blue-700 mt-0.5">{val}</p>
                  <p className="text-xs text-gray-400">MET-분/주</p>
                </div>
              ))}
            </div>
            <div className={`rounded-lg px-3 py-2 text-sm font-semibold text-center ${
              activityLevel.includes('높은') ? 'bg-green-100 text-green-800' :
              activityLevel.includes('중간') ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-700'
            }`}>
              💪 신체 활동 수준: {activityLevel}
            </div>
          </div>
        </div>
      )}

      {/* ── 6페이지: MNA-SF ── */}
      {page === 6 && (() => {
        // BMI 자동 계산
        const h = data.height, w = data.weight
        const autoBmi = h && w && h > 0 ? w / Math.pow(h / 100, 2) : null
        let autoBmiScore = null
        let autoBmiLabel = ''
        if (autoBmi) {
          if (autoBmi < 19)       { autoBmiScore = 0; autoBmiLabel = `BMI < 19 (현재: ${autoBmi.toFixed(2)})` }
          else if (autoBmi < 21)  { autoBmiScore = 1; autoBmiLabel = `19 ≤ BMI < 21 (현재: ${autoBmi.toFixed(2)})` }
          else if (autoBmi < 23)  { autoBmiScore = 2; autoBmiLabel = `21 ≤ BMI < 23 (현재: ${autoBmi.toFixed(2)})` }
          else                    { autoBmiScore = 3; autoBmiLabel = `BMI ≥ 23 (현재: ${autoBmi.toFixed(2)})` }
          // BMI 자동 반영
          if (data.mna_bmi_category === undefined || data.mna_bmi_category === null) {
            update({ mna_bmi_category: String(autoBmiScore) })
          }
        }

        // 점수 계산 (Streamlit과 동일)
        const aScore = Number(data.mna_appetite_change ?? 2)
        const wScore = Number(data.mna_weight_change ?? 3)
        const mScore = Number(data.mna_mobility ?? 2)
        const sScore = Number(data.mna_stress_illness ?? 2)
        const nScore = Number(data.mna_neuropsychological_problem ?? 2)
        const bScore = autoBmi !== null ? autoBmiScore : Number(data.mna_bmi_category ?? 3)
        const totalMnaScore = aScore + wScore + mScore + sScore + nScore + bScore

        return (
          <div>
            <h2 className="section-title">영양 상태 평가 (MNA-SF)</h2>
            <InfoBox>📝 간이 영양 평가 (Mini Nutritional Assessment - Short Form)</InfoBox>

            {autoBmi && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-blue-800">
                📊 기초 조사표 기준 BMI: <strong>{autoBmi.toFixed(2)} kg/m²</strong>
              </div>
            )}

            {/* A */}
            <div className="mb-5">
              <p className="font-semibold text-gray-800 mb-3">A. 지난 3개월 동안 밥맛이 없거나, 소화가 잘 안되거나, 씹고 삼키는 것이 어려워서 식사량이 줄었습니까?</p>
              <RadioGroup label="" options={[
                {value:'0', label:'많이 줄었다'},
                {value:'1', label:'조금 줄었다'},
                {value:'2', label:'변화 없다'},
              ]} value={String(data.mna_appetite_change ?? '')} onChange={v => update({mna_appetite_change: v})} />
            </div>

            {/* B */}
            <div className="mb-5">
              <p className="font-semibold text-gray-800 mb-3">B. 지난 3개월 동안 몸무게가 줄었습니까?</p>
              <RadioGroup label="" options={[
                {value:'0', label:'3kg 이상 감소'},
                {value:'1', label:'모르겠다'},
                {value:'2', label:'1kg~3kg 감소'},
                {value:'3', label:'변화 없다'},
              ]} value={String(data.mna_weight_change ?? '')} onChange={v => update({mna_weight_change: v})} />
            </div>

            {/* C */}
            <div className="mb-5">
              <p className="font-semibold text-gray-800 mb-3">C. 거동 능력</p>
              <RadioGroup label="" options={[
                {value:'0', label:'외출 불가, 침대나 의자에서만 생활 가능'},
                {value:'1', label:'외출 불가, 집에서만 활동 가능'},
                {value:'2', label:'외출 가능, 활동 제약 없음'},
              ]} value={String(data.mna_mobility ?? '')} onChange={v => update({mna_mobility: v})} />
            </div>

            {/* D */}
            <div className="mb-5">
              <p className="font-semibold text-gray-800 mb-3">D. 지난 3개월 동안 정신적 스트레스를 경험했거나 급성 질환을 앓았던 적이 있습니까?</p>
              <RadioGroup label="" options={[
                {value:'0', label:'예'},
                {value:'2', label:'아니오'},
              ]} value={String(data.mna_stress_illness ?? '')} onChange={v => update({mna_stress_illness: v})} />
            </div>

            {/* E */}
            <div className="mb-5">
              <p className="font-semibold text-gray-800 mb-3">E. 신경 정신과적 문제</p>
              <RadioGroup label="" options={[
                {value:'0', label:'중증 치매나 우울증'},
                {value:'1', label:'경증 치매'},
                {value:'2', label:'없음'},
              ]} value={String(data.mna_neuropsychological_problem ?? '')} onChange={v => update({mna_neuropsychological_problem: v})} />
            </div>

            {/* F - BMI 자동 or 수동 */}
            <div className="mb-5">
              <p className="font-semibold text-gray-800 mb-3">F. 체질량지수 (BMI = kg / m²)</p>
              {autoBmi ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                  📊 자동 산출: <strong>{autoBmiLabel}</strong> → 점수: {autoBmiScore}점
                </div>
              ) : (
                <RadioGroup label="" options={[
                  {value:'0', label:'BMI < 19'},
                  {value:'1', label:'19 ≤ BMI < 21'},
                  {value:'2', label:'21 ≤ BMI < 23'},
                  {value:'3', label:'BMI ≥ 23'},
                ]} value={String(data.mna_bmi_category ?? '')} onChange={v => update({mna_bmi_category: v})} />
              )}
            </div>

            {/* 결과 */}
            <div className="border-t border-gray-200 pt-4 mt-2">
              <p className="text-sm font-semibold text-gray-700 mb-3">📊 MNA-SF 결과</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">총점</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{totalMnaScore}<span className="text-sm text-gray-400"> / 14점</span></p>
                </div>
                <div className={`rounded-xl p-3 text-center ${totalMnaScore >= 12 ? 'bg-green-50' : totalMnaScore >= 8 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                  <p className="text-xs text-gray-500">영양 상태</p>
                  <p className={`text-sm font-bold mt-1 ${totalMnaScore >= 12 ? 'text-green-700' : totalMnaScore >= 8 ? 'text-yellow-700' : 'text-red-700'}`}>
                    {totalMnaScore >= 12 ? '정상 영양 상태' : totalMnaScore >= 8 ? '영양불량 위험' : '영양불량'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-600 leading-relaxed">
                <strong>해석 기준:</strong><br/>
                12~14점: 정상 영양 상태 &nbsp;|&nbsp; 8~11점: 영양불량 위험 &nbsp;|&nbsp; 0~7점: 영양불량
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── 7페이지: K-MBI ── */}
      {page === 7 && (
        <div>
          <h2 className="section-title">K-MBI (한국판 수정 바델 지수)</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">K-MBI 평가 안내</p>
            <p>각 항목에 대해 대상자의 현재 수행 능력을 평가해주세요.</p>
            <p className="mt-1.5 font-medium">⚠️ 보행과 의자차(휠체어)는 둘 중 하나만 선택합니다.<br/>
            보행 가능: 보행 점수 적용 (100점 만점) / 휠체어: 의자차 점수 적용 (90점 만점)</p>
          </div>

          <div className="space-y-4">
            {KMBI_ITEMS.map((item, idx) => {
              const curIdx = data[item.id] !== undefined && data[item.id] !== null && data[item.id] !== ''
                ? Number(data[item.id]) : null
              return (
                <div key={item.id} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-0.5">{idx+1}. {item.label}</p>
                  <p className="text-xs text-gray-400 mb-3">📌 {item.desc}</p>
                  {(item.isWalk || item.isWheelchair) && (
                    <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5 mb-3">
                      ⚠️ 보행과 의자차(휠체어) 중 하나만 선택하세요. 다른 하나는 '해당 사항 없음'으로 선택합니다.
                    </p>
                  )}
                  <div className="space-y-2">
                    {item.options.map((opt, optIdx) => {
                      const score = item.scores[optIdx]
                      return (
                        <label key={optIdx} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name={item.id}
                            checked={curIdx === optIdx}
                            onChange={() => update({ [item.id]: optIdx })}
                            className="accent-blue-600 w-4 h-4 shrink-0"
                          />
                          <span className="text-sm text-gray-700 flex-1">{opt}</span>
                          <span className="text-xs text-blue-600 font-medium shrink-0">{score}점</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 결과 */}
          <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-3">📊 K-MBI 평가 결과</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">총점</p>
                <p className="text-xl font-bold text-blue-700 mt-1">{kmbiScore}<span className="text-xs text-gray-400">/{kmbiMaxScore}점</span></p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">이동 수단</p>
                <p className="text-sm font-bold text-gray-700 mt-1">{mobilityType}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">도움의 수준</p>
                <p className="text-sm font-bold text-gray-700 mt-1">{kmbiEmoji} {kmbiStatus}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg px-4 py-3 text-xs text-gray-600 leading-relaxed">
              <strong>해석 기준:</strong><br/>
              0~24점: 완전 의존 · 25~49점: 대부분 의존 · 50~74점: 중간 의존 · 75~90점: 경도 의존 · 91~99점: 최소 의존<br/>
              <strong className="text-blue-700">현재: {kmbiScore}/{kmbiMaxScore}점 ({kmbiPct.toFixed(1)}%) - {kmbiStatus} / 이동방식: {mobilityType}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── 8페이지: MMSE ── */}
      {page === 8 && (
        <div>
          <h2 className="section-title">인지기능 평가 (MMSE-K)</h2>
          <InfoBox>각 항목에 정답이면 ✅, 틀리면 ❌를 선택하세요. (총 30점)</InfoBox>
          <div className="space-y-2">
            {MMSE_ITEMS.map(item => (
              <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                <div className="flex gap-2 ml-4">
                  {[{v:1,l:'✅'},{v:0,l:'❌'}].map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => update({ [item.key]: opt.v })}
                      className={`w-10 h-8 rounded text-sm font-medium border transition-colors ${
                        data[item.key] === opt.v
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-blue-300'
                      }`}
                    >{opt.l}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <InfoBox type={mmseScore >= 24 ? 'success' : mmseScore >= 18 ? 'warning' : 'info'} >
            MMSE-K 총점: <strong>{mmseScore} / 30점</strong> — {mmseScore >= 24 ? '정상' : mmseScore >= 18 ? '경증 인지장애' : '중증 인지장애'}
          </InfoBox>
        </div>
      )}

      {/* ── 9페이지: 시설 특성 ── */}
      {page === 9 && (
        <div>
          <h2 className="section-title">시설 특성</h2>
          <NumberField label="시설 정원 (명)" value={data.facility_capacity} onChange={v => update({facility_capacity:v})} min={0} />
          <SelectField label="시설 소재지" options={['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']} value={data.facility_location} onChange={v => update({facility_location:v})} />
          <RadioGroup label="영양사 배치 여부" options={['예','아니오']} value={data.nutritionist_present === true ? '예' : data.nutritionist_present === false ? '아니오' : undefined} onChange={v => update({nutritionist_present: v === '예'})} horizontal />
        </div>
      )}
    </SurveyLayout>
  )
}