export function tx(language, koText, enText) {
  return language === 'ko' ? koText : enText
}

export function goalLabel(language, goal) {
  if (goal === 'diet') {
    return tx(language, '감량', 'Cut')
  }
  if (goal === 'bulk') {
    return tx(language, '벌크업', 'Bulk')
  }
  return tx(language, '유지', 'Maintain')
}

export function activityLevelLabel(language, level) {
  const labels = {
    sedentary: tx(language, '거의 안 움직임', 'Sedentary'),
    light: tx(language, '가벼운 활동', 'Light'),
    moderate: tx(language, '보통 활동', 'Moderate'),
    high: tx(language, '활동 많음', 'High'),
  }

  return labels[level] || level
}

export function unitSystemLabel(language, unitSystem) {
  const labels = {
    metric: tx(language, '미터법', 'Metric'),
    imperial: tx(language, '야드파운드법', 'Imperial'),
  }

  return labels[unitSystem] || unitSystem
}

export function nutritionPreferenceLabel(language, preference) {
  const labels = {
    balanced: tx(language, '균형형', 'Balanced'),
    'high-protein': tx(language, '고단백', 'High Protein'),
    'low-carb': tx(language, '저탄수', 'Low Carb'),
  }

  return labels[preference] || preference
}

export function macroRatioPresetLabel(language, preset) {
  const labels = {
    balanced: tx(language, '기본 4:4:2', 'Default 4:4:2'),
    lower_carb: tx(language, '변경 5:3:2', 'Alternative 5:3:2'),
  }

  return labels[preset] || preset
}

export function sexLabel(language, sex) {
  const labels = {
    male: tx(language, '남성', 'Male'),
    female: tx(language, '여성', 'Female'),
    other: tx(language, '기타', 'Other'),
  }

  return labels[sex] || sex
}

export function healthStatusLabel(language, status) {
  const labels = {
    connected: tx(language, '연결됨', 'Connected'),
    disconnected: tx(language, '연결 안 됨', 'Disconnected'),
    pending: tx(language, '대기 중', 'Pending'),
    error: tx(language, '오류', 'Error'),
  }

  return labels[status] || status
}

export function healthSourceLabel(language, source) {
  const labels = {
    'Apple Health': tx(language, 'Apple Health', 'Apple Health'),
    'Health Connect': tx(language, 'Health Connect', 'Health Connect'),
    Manual: tx(language, '수동', 'Manual'),
  }

  return labels[source] || source
}

export function mealTypeLabel(language, mealType) {
  const labels = {
    breakfast: tx(language, '아침', 'Breakfast'),
    lunch: tx(language, '점심', 'Lunch'),
    dinner: tx(language, '저녁', 'Dinner'),
    snack: tx(language, '간식', 'Snacks'),
  }

  return labels[mealType] || mealType
}

export function languageLabel(language, value) {
  return value === 'ko'
    ? tx(language, '한국어', 'Korean')
    : tx(language, '영어', 'English')
}
