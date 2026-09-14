/**
 * 청첩장 콘텐츠 / 에셋 경로 모음
 * - 문구·일정·계좌·사진은 여기만 수정하면 됩니다.
 * - 사진 교체: assets/images/ 에 파일을 넣고 아래 src 경로를 바꾸세요.
 */
window.WEDDING_DATA = {
  meta: {
    title: "건, 채림 결혼합니다🩷",
    documentTitle: "건, 채림 결혼합니다🩷",
  },

  couple: {
    groom: { ko: "박건", en: "Geun" },
    bride: { ko: "김채림", en: "Chaelim" },
  },

  ceremony: {
    /** ISO-like local for calendar / D-day */
    dateISO: "2027-01-09",
    timeLabel: "오후 1시 30분",
    weekdayLabel: "토요일",
    fullDateLabel: "2027년 1월 9일 토요일 오후 1시 30분",
    verticalDate: "2027.01.09 오후 1시 30분",
    venueName: "신림 그레이스 파티",
    venueHall: "7층 그레이스홀",
    verticalVenue: "신림 그레이스 파티 7층 그레이스홀",
    addressLines: [
      "서울 관악구 남부순환로 1440",
      "서울 관악구 신림동 1485-1",
    ],
  },

  /** 히어로·갤러리 등 이미지는 src만 교체 */
  images: {
    hero: {
      src: "assets/images/hero.svg",
      alt: "신랑 신부 메인 사진",
    },
    gallery: [
      { src: "assets/images/gallery-01.svg", alt: "갤러리 사진 1" },
      { src: "assets/images/gallery-02.svg", alt: "갤러리 사진 2" },
      { src: "assets/images/gallery-03.svg", alt: "갤러리 사진 3" },
      { src: "assets/images/gallery-04.svg", alt: "갤러리 사진 4" },
      { src: "assets/images/gallery-05.svg", alt: "갤러리 사진 5" },
      { src: "assets/images/gallery-06.svg", alt: "갤러리 사진 6" },
    ],
  },

  invite: {
    heading: "소중한 분들을 초대합니다.",
    storyEyebrow: "LITHUANIA, 2019 → KOREA, 2027",
    paragraphs: [
      "교환학생으로 떠난 리투아니아에서",
      "평생 같이 살 사람을 데려왔습니다.",
      "저희의 새로운 시작을 함께 축복해 주세요.",
    ],
  },

  parents: {
    groomSide: {
      label: "신랑측",
      father: { name: "박덕영", deceased: true, phone: "" },
      mother: { name: "최미옥", deceased: true, phone: "" },
      relation: "장남",
      childName: "박건",
    },
    brideSide: {
      label: "신부측",
      father: { name: "김제찬", deceased: true, phone: "" },
      mother: { name: "이현순", deceased: true, phone: "" },
      relation: "장녀",
      childName: "김채림",
    },
  },

  transport: {
    bus: {
      title: "버스",
      lines: ["500/504/643/651", "5413/5528/5530/5535", "5615/5616/6512", "9/9-3"],
      note: "정거장 : 관악구 보훈회관(신림 푸르지오)",
    },
    subway: {
      title: "지하철",
      note: "신림역 5번출구 셔틀 버스 운행",
    },
    car: {
      title: "자차",
      notes: ["주차장 2시간 무료"],
    },
    mapLinks: {
      tmap: "https://www.tmap.co.kr/tmap2/mobile/tmap.jsp?name=%EC%8B%A0%EB%A6%BC%20%EA%B7%B8%EB%A0%88%EC%9D%B4%EC%8A%A4%20%ED%8C%8C%ED%8B%B0&lon=126.9296&lat=37.4842",
      kakao: "https://map.kakao.com/link/map/%EA%B7%B8%EB%A0%88%EC%9D%B4%EC%8A%A4%ED%8C%8C%ED%8B%B0%20%EA%B4%80%EC%95%85%EB%B3%B8%EC%A0%90,37.4842,126.9296",
      naver: "https://map.naver.com/v5/search/%EC%8B%A0%EB%A6%BC%20%EA%B7%B8%EB%A0%88%EC%9D%B4%EC%8A%A4%20%ED%8C%8C%ED%8B%B0",
    },
    /** 카카오 인터랙티브 지도 (그레이스파티 신림) */
    kakaoMap: {
      searchKeyword: "그레이스파티 신림",
      placeName: "그레이스파티 관악본점",
      lat: 37.4842,
      lng: 126.9296,
      wcong: { x: 484435, y: 1106882 },
      level: 3,
      height: 280,
      embedUrl:
        "https://map.kakao.com/?urlX=484435&urlY=1106882&urlLevel=3&map_type=TYPE_MAP&map_hybrid=false&name=%EA%B7%B8%EB%A0%88%EC%9D%B4%EC%8A%A4%ED%8C%8C%ED%8B%B0+%EA%B4%80%EC%95%85%EB%B3%B8%EC%A0%90",
      /** RoughMap: map.kakao.com → HTML 태그 복사의 timestamp/key */
      roughMap: { timestamp: "", key: "" },
      /** JS SDK: Kakao Developers JavaScript 키 (있으면 장소 검색 지도) */
      appKey: "",
      markerTitle: "그레이스파티 신림",
    },
  },

  accounts: {
    heading: "마음 전하실 곳",
    groomSide: {
      label: "신랑측",
      items: [
        {
          role: "신랑",
          bank: "카카오뱅크",
          holder: "왕가슴",
          number: "1111-1111-1111-1111",
        },
        {
          role: "신랑 아버지",
          bank: "카카오뱅크",
          holder: "박덕영",
          number: "1111-1111-1111-1111",
        },
        {
          role: "신랑 어머니",
          bank: "카카오뱅크",
          holder: "최미옥",
          number: "1111-1111-1111-1111",
        },
      ],
    },
    brideSide: {
      label: "신부측",
      items: [
        {
          role: "신부",
          bank: "카카오뱅크",
          holder: "김채림",
          number: "1111-1111-1111-1111",
        },
        {
          role: "신부 아버지",
          bank: "카카오뱅크",
          holder: "김제찬",
          number: "1111-1111-1111-1111",
        },
        {
          role: "신부 어머니",
          bank: "카카오뱅크",
          holder: "이현순",
          number: "1111-1111-1111-1111",
        },
      ],
    },
  },

  gallery: {
    heading: "갤러리",
    initialCount: 4,
    moreLabel: "더 보기",
  },
};
