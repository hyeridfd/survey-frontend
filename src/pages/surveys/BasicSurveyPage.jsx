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

// K-MBI 항목 설정
const KMBI_ITEMS = [
  { id: 'kmbi_1', label: '개인위생', options: ['0: 도움 필요','5: 독립적 수행'] },
  { id: 'kmbi_2', label: '목욕하기', options: ['0: 도움 필요','5: 독립적 수행'] },
  { id: 'kmbi_3', label: '식사하기', options: ['0: 완전 도움','5: 부분 도움','10: 독립적'] },
  { id: 'kmbi_4', label: '용변처리', options: ['0: 완전 도움','5: 부분 도움','10: 독립적'] },
  { id: 'kmbi_5', label: '계단 오르기', options: ['0: 불가능','5: 부분 도움','10: 독립적'] },
  { id: 'kmbi_6', label: '옷 입기', options: ['0: 완전 도움','5: 부분 도움','10: 독립적'] },
  { id: 'kmbi_7', label: '대변 조절', options: ['0: 실금','5: 가끔 실금','10: 완전 조절'] },
  { id: 'kmbi_8', label: '소변 조절', options: ['0: 실금','5: 가끔 실금','10: 완전 조절'] },
  { id: 'kmbi_9', label: '의자/침대 이동', options: ['0: 불가능','5: 최대 도움','10: 최소 도움','15: 독립적'] },
  { id: 'kmbi_10', label: '보행', options: ['0: 불가능','5: 휠체어','10: 1인 도움','15: 독립적'] },
  { id: 'kmbi_11', label: '휠체어 이동', options: ['0: 불가능','5: 부분 도움','10: 독립적'] },
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
  const activityLevel = totalMet >= 3000 ? '높은 신체 활동 (High)' : totalMet >= 600 ? '중간 수준 (Moderate)' : '낮은 신체 활동 (Low)'

  // K-MBI 점수
  const kmbiScore = KMBI_ITEMS.reduce((sum, item) => {
    const v = data[item.id]
    return sum + (v ? parseInt(v) : 0)
  }, 0)

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

          <p className="font-medium text-gray-700 mb-3">1. 격렬한 신체 활동 <span className="text-xs text-gray-400">(무거운 물건 들기, 에어로빅 등)</span></p>
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="지난 7일 중 며칠?" value={data.vigorous_activity_days} onChange={v => update({vigorous_activity_days:v})} unit="일" min={0} max={7} />
            <NumberField label="하루 평균 시간" value={data.vigorous_activity_time} onChange={v => update({vigorous_activity_time:v})} unit="분" min={0} />
          </div>

          <Divider label="중간 정도 활동" />
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="지난 7일 중 며칠?" value={data.moderate_activity_days} onChange={v => update({moderate_activity_days:v})} unit="일" min={0} max={7} />
            <NumberField label="하루 평균 시간" value={data.moderate_activity_time} onChange={v => update({moderate_activity_time:v})} unit="분" min={0} />
          </div>

          <Divider label="걷기" />
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="지난 7일 중 며칠?" value={data.walking_days} onChange={v => update({walking_days:v})} unit="일" min={0} max={7} />
            <NumberField label="하루 평균 시간" value={data.walking_time} onChange={v => update({walking_time:v})} unit="분" min={0} />
          </div>

          <Divider label="앉아 있는 시간" />
          <NumberField label="평일 하루 앉아서 보낸 시간" value={data.sitting_time} onChange={v => update({sitting_time:v})} unit="분" min={0} max={1440} />

          <InfoBox type="success">
            📊 총 신체 활동량: <strong>{totalMet.toFixed(0)} MET-분/주</strong><br/>
            활동 수준: <strong>{activityLevel}</strong>
          </InfoBox>
        </div>
      )}

      {/* ── 6페이지: MNA-SF ── */}
      {page === 6 && (
        <div>
          <h2 className="section-title">영양 상태 평가 (MNA-SF)</h2>
          <SelectField label="A. 지난 3개월간 식욕 감소로 식사량이 줄었습니까?" options={[{value:'0',label:'0: 심하게 줄었음'},{value:'1',label:'1: 보통으로 줄었음'},{value:'2',label:'2: 변화 없음'}]} value={data.mna_appetite_change} onChange={v => update({mna_appetite_change:v})} />
          <SelectField label="B. 지난 3개월간 체중이 감소하였습니까?" options={[{value:'0',label:'0: 3kg 이상 감소'},{value:'1',label:'1: 모름'},{value:'2',label:'2: 1~3kg 감소'},{value:'3',label:'3: 변화 없음'}]} value={data.mna_weight_change} onChange={v => update({mna_weight_change:v})} />
          <SelectField label="C. 운동 가능 여부" options={[{value:'0',label:'0: 침대·의자 생활'},{value:'1',label:'1: 침대·의자에서 일어나나 외출 안 함'},{value:'2',label:'2: 외출 가능'}]} value={data.mna_mobility} onChange={v => update({mna_mobility:v})} />
          <SelectField label="D. 지난 3개월간 심리적 스트레스나 급성 질환을 앓았습니까?" options={[{value:'0',label:'0: 예'},{value:'2',label:'2: 아니오'}]} value={data.mna_stress_illness} onChange={v => update({mna_stress_illness:v})} />
          <SelectField label="E. 신경·정신적 문제" options={[{value:'0',label:'0: 중증 치매 또는 우울증'},{value:'1',label:'1: 경증 치매'},{value:'2',label:'2: 없음'}]} value={data.mna_neuropsychological_problem} onChange={v => update({mna_neuropsychological_problem:v})} />
          <SelectField label="F. BMI 범주" options={[{value:'0',label:'0: BMI < 19'},{value:'1',label:'1: 19 ≤ BMI < 21'},{value:'2',label:'2: 21 ≤ BMI < 23'},{value:'3',label:'3: BMI ≥ 23'}]} value={data.mna_bmi_category} onChange={v => update({mna_bmi_category:v})} />
          <InfoBox type={mnaScore >= 12 ? 'success' : mnaScore >= 8 ? 'warning' : 'info'}>
            MNA-SF 총점: <strong>{mnaScore}/14</strong> — {mnaScore >= 12 ? '정상 영양상태' : mnaScore >= 8 ? '영양불량 위험' : '영양불량'}
          </InfoBox>
        </div>
      )}

      {/* ── 7페이지: K-MBI ── */}
      {page === 7 && (
        <div>
          <h2 className="section-title">일상생활 수행능력 (K-MBI)</h2>
          <div className="space-y-3">
            {KMBI_ITEMS.map(item => (
              <SelectField
                key={item.id}
                label={item.label}
                options={item.options.map(o => ({ value: o.split(':')[0].trim(), label: o }))}
                value={data[item.id]}
                onChange={v => update({ [item.id]: v })}
              />
            ))}
          </div>
          <InfoBox type="success">K-MBI 총점: <strong>{kmbiScore} / 100점</strong></InfoBox>
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
