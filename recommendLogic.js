/**
 * 백엔드 2: 날씨 및 사용자 설정 기반 의류 추천(로컬 저장)
 */

// 1. 기온 8구간 및 코디 데이터
const OUTFIT_TIERS = [
  {
    maxTemp: 4,
    tierName: "한파 (4°C 이하)",
    description: "패딩과 목도리로 완전 무장하세요!",
    tops: ["기모 후드티", "목폴라 니트", "히트텍"],
    outters: ["헤비 패딩", "롱패딩", "두꺼운 울 코트"],
    bottoms: ["기모 바지", "기모 데님", "울 팬츠"]
  },
  {
    minTemp: 5, maxTemp: 8,
    tierName: "쌀쌀함 (5°C ~ 8°C)",
    description: "코트와 가죽 자켓을 꺼내 입기 좋은 날씨예요.",
    tops: ["니트", "기모 맨투맨"],
    outters: ["울 코트", "가죽 자켓", "트렌치코트"],
    bottoms: ["슬랙스", "데님 팬츠", "면바지"]
  },
  {
    minTemp: 9, maxTemp: 11,
    tierName: "서늘함 (9°C ~ 11°C)",
    description: "가벼운 자켓이나 가디건이 필수입니다.",
    tops: ["맨투맨", "셔츠", "가벼운 니트"],
    outters: ["자켓", "가디건", "야상"],
    bottoms: ["청바지", "면바지", "슬랙스"]
  },
  {
    minTemp: 12, maxTemp: 16,
    tierName: "선선함 (12°C ~ 16°C)",
    description: "자켓이나 셔츠 하나로 깔끔하게 입어보세요.",
    tops: ["긴팔 티셔츠", "셔츠", "블라우스"],
    outters: ["가디건", "청자켓", "바람막이"],
    bottoms: ["데님", "슬랙스", "롱스커트"]
  },
  {
    minTemp: 17, maxTemp: 19,
    tierName: "활동하기 좋은 (17°C ~ 19°C)",
    description: "얇은 가디건이나 긴팔 티셔츠가 딱 좋습니다.",
    tops: ["긴팔 티셔츠", "얇은 셔츠"],
    outters: ["얇은 가디건", "후드집업 (선택)"],
    bottoms: ["면바지", "청바지", "슬랙스"]
  },
  {
    minTemp: 20, maxTemp: 22,
    tierName: "쾌적함 (20°C ~ 22°C)",
    description: "얇은 긴팔이나 셔츠 차림이 어울려요.",
    tops: ["긴팔 티셔츠", "셔츠", "브이넥 니트"],
    outters: [],
    bottoms: ["면바지", "슬랙스", "스커트"]
  },
  {
    minTemp: 23, maxTemp: 27,
    tierName: "따뜻함/더위 시작 (23°C ~ 27°C)",
    description: "반팔과 얇은 옷차림을 추천합니다.",
    tops: ["반팔 티셔츠", "민소매", "얇은 셔츠"],
    outters: [],
    bottoms: ["반바지", "면바지", "린넨 팬츠"]
  },
  {
    minTemp: 28,
    tierName: "더움 (28°C 이상)",
    description: "시원하고 통기성 좋은 옷을 입으세요!",
    tops: ["민소매", "반팔 티셔츠"],
    outters: [],
    bottoms: ["반바지", "린넨 쇼츠"]
  }
];

// 2. 사용자 민감도 설정 로컬 스토리지 관리 함수 
const SENSITIVITY_KEY = 'user_weather_sensitivity';

export function getSavedSensitivity() {
  return localStorage.getItem(SENSITIVITY_KEY) || 'normal'; // 기본값 '보통'
}

export function saveSensitivity(sensitivity) {
  localStorage.setItem(SENSITIVITY_KEY, sensitivity);
}

// 3. 민감도에 따른 체감온도 보정 함수
function calculateAdjustedTemp(feelsLike, sensitivity) {
  let offset = 0;
  if (sensitivity === 'cold') offset = -3; // 추위 탐 -> 3도 낮춰서 따뜻하게
  if (sensitivity === 'hot') offset = 3;   // 더위 탐 -> 3도 높여서 시원하게
  return feelsLike + offset;
}

// 4. 날씨 조건(비·눈·바람) 아이템 매칭
function getExtraItems(weatherCond) {
  const extras = [];
  if (weatherCond.isRaining) extras.push({ item: "우산", emoji: "☂️" });
  if (weatherCond.isSnowing) extras.push({ item: "방한 장갑 / 우산", emoji: "🧤" });
  if (weatherCond.windSpeed >= 8.0) extras.push({ item: "방풍 윈드브레이커", emoji: "💨" });
  return extras;
}

// 5. 메인 추천 실행 함수
export function getOutfitRecommendation(input) {
  const { feelsLike, sensitivity = getSavedSensitivity(), isRaining = false, isSnowing = false, windSpeed = 0 } = input;

  const targetTemp = calculateAdjustedTemp(feelsLike, sensitivity);

  let matchedTier = OUTFIT_TIERS.find(tier => {
    if (tier.minTemp !== undefined && tier.maxTemp !== undefined) {
      return targetTemp >= tier.minTemp && targetTemp <= tier.maxTemp;
    } else if (tier.maxTemp !== undefined) {
      return targetTemp <= tier.maxTemp;
    } else if (tier.minTemp !== undefined) {
      return targetTemp >= tier.minTemp;
    }
    return false;
  });

  if (!matchedTier) {
    matchedTier = targetTemp > 28 ? OUTFIT_TIERS[OUTFIT_TIERS.length - 1] : OUTFIT_TIERS[0];
  }

  const extras = getExtraItems({ isRaining, isSnowing, windSpeed });

  return {
    feelsLike,
    adjustedTemp: targetTemp,
    sensitivity,
    tierName: matchedTier.tierName,
    description: matchedTier.description,
    recommendations: {
      tops: matchedTier.tops,
      outters: matchedTier.outters,
      bottoms: matchedTier.bottoms,
      extras: extras
    }
  };
}