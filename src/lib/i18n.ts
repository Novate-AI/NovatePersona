/**
 * Lightweight i18n system.
 * Detects browser language and provides translations for UI labels.
 * The "target language" (what you're practicing) is separate from "UI language" (what the interface shows).
 */

export type UILocale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'ar'

const translations: Record<UILocale, Record<string, string>> = {
  en: {
    'tutor.messages': 'messages',
    'tutor.corrections': 'corrections',
    'tutor.tryScenario': 'Try a scenario',
    'tutor.placeholder': 'Say something in {lang}...',
    'tutor.stopSend': 'Stop & send',
    'tutor.record': 'Record',
    'tutor.send': 'Send',
    'tutor.listen': 'Listen',
    'tutor.speakerActive': 'Speaker active — mic paused',
    'tutor.starter.coffee': 'Order coffee at a café',
    'tutor.starter.directions': 'Ask for directions',
    'tutor.starter.introduce': 'Introduce yourself at a party',
    'tutor.starter.weekend': 'Describe your weekend',
    'tutor.starter.weather': 'Complain about the weather',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.about': 'About',
  },
  es: {
    'tutor.messages': 'mensajes',
    'tutor.corrections': 'correcciones',
    'tutor.tryScenario': 'Prueba un escenario',
    'tutor.placeholder': 'Di algo en {lang}...',
    'tutor.stopSend': 'Parar y enviar',
    'tutor.record': 'Grabar',
    'tutor.send': 'Enviar',
    'tutor.listen': 'Escuchar',
    'tutor.speakerActive': 'Altavoz activo — micrófono en pausa',
    'tutor.starter.coffee': 'Pedir café en una cafetería',
    'tutor.starter.directions': 'Pedir indicaciones',
    'tutor.starter.introduce': 'Presentarte en una fiesta',
    'tutor.starter.weekend': 'Describir tu fin de semana',
    'tutor.starter.weather': 'Quejarte del tiempo',
    'nav.features': 'Funciones',
    'nav.pricing': 'Precios',
    'nav.about': 'Acerca de',
  },
  fr: {
    'tutor.messages': 'messages',
    'tutor.corrections': 'corrections',
    'tutor.tryScenario': 'Essayer un scénario',
    'tutor.placeholder': 'Dites quelque chose en {lang}...',
    'tutor.stopSend': 'Arrêter et envoyer',
    'tutor.record': 'Enregistrer',
    'tutor.send': 'Envoyer',
    'tutor.listen': 'Écouter',
    'tutor.speakerActive': 'Haut-parleur actif — micro en pause',
    'tutor.starter.coffee': 'Commander un café',
    'tutor.starter.directions': 'Demander son chemin',
    'tutor.starter.introduce': 'Se présenter à une fête',
    'tutor.starter.weekend': 'Décrire son week-end',
    'tutor.starter.weather': 'Se plaindre du temps',
    'nav.features': 'Fonctionnalités',
    'nav.pricing': 'Tarifs',
    'nav.about': 'À propos',
  },
  de: {
    'tutor.messages': 'Nachrichten',
    'tutor.corrections': 'Korrekturen',
    'tutor.tryScenario': 'Szenario ausprobieren',
    'tutor.placeholder': 'Sag etwas auf {lang}...',
    'tutor.stopSend': 'Stoppen & senden',
    'tutor.record': 'Aufnehmen',
    'tutor.send': 'Senden',
    'tutor.listen': 'Anhören',
    'tutor.speakerActive': 'Lautsprecher aktiv — Mikro pausiert',
    'tutor.starter.coffee': 'Kaffee in einem Café bestellen',
    'tutor.starter.directions': 'Nach dem Weg fragen',
    'tutor.starter.introduce': 'Sich auf einer Party vorstellen',
    'tutor.starter.weekend': 'Dein Wochenende beschreiben',
    'tutor.starter.weather': 'Über das Wetter beschweren',
    'nav.features': 'Funktionen',
    'nav.pricing': 'Preise',
    'nav.about': 'Über uns',
  },
  it: {
    'tutor.messages': 'messaggi',
    'tutor.corrections': 'correzioni',
    'tutor.tryScenario': 'Prova uno scenario',
    'tutor.placeholder': 'Dì qualcosa in {lang}...',
    'tutor.stopSend': 'Ferma e invia',
    'tutor.record': 'Registra',
    'tutor.send': 'Invia',
    'tutor.listen': 'Ascolta',
    'tutor.speakerActive': 'Altoparlante attivo — microfono in pausa',
    'tutor.starter.coffee': 'Ordinare un caffè al bar',
    'tutor.starter.directions': 'Chiedere indicazioni',
    'tutor.starter.introduce': 'Presentarsi a una festa',
    'tutor.starter.weekend': 'Descrivere il fine settimana',
    'tutor.starter.weather': 'Lamentarsi del tempo',
    'nav.features': 'Funzionalità',
    'nav.pricing': 'Prezzi',
    'nav.about': 'Chi siamo',
  },
  pt: {
    'tutor.messages': 'mensagens',
    'tutor.corrections': 'correções',
    'tutor.tryScenario': 'Tente um cenário',
    'tutor.placeholder': 'Diga algo em {lang}...',
    'tutor.stopSend': 'Parar e enviar',
    'tutor.record': 'Gravar',
    'tutor.send': 'Enviar',
    'tutor.listen': 'Ouvir',
    'tutor.speakerActive': 'Alto-falante ativo — microfone pausado',
    'tutor.starter.coffee': 'Pedir café num café',
    'tutor.starter.directions': 'Pedir direções',
    'tutor.starter.introduce': 'Apresentar-se numa festa',
    'tutor.starter.weekend': 'Descrever o fim de semana',
    'tutor.starter.weather': 'Reclamar do tempo',
    'nav.features': 'Recursos',
    'nav.pricing': 'Preços',
    'nav.about': 'Sobre',
  },
  ja: {
    'tutor.messages': 'メッセージ',
    'tutor.corrections': '修正',
    'tutor.tryScenario': 'シナリオを試す',
    'tutor.placeholder': '{lang}で何か言ってみて...',
    'tutor.stopSend': '停止して送信',
    'tutor.record': '録音',
    'tutor.send': '送信',
    'tutor.listen': '聞く',
    'tutor.speakerActive': 'スピーカー再生中 — マイク一時停止',
    'tutor.starter.coffee': 'カフェでコーヒーを注文する',
    'tutor.starter.directions': '道を尋ねる',
    'tutor.starter.introduce': 'パーティーで自己紹介する',
    'tutor.starter.weekend': '週末について話す',
    'tutor.starter.weather': '天気について愚痴を言う',
    'nav.features': '機能',
    'nav.pricing': '料金',
    'nav.about': '概要',
  },
  ko: {
    'tutor.messages': '메시지',
    'tutor.corrections': '교정',
    'tutor.tryScenario': '시나리오 시도',
    'tutor.placeholder': '{lang}(으)로 말해보세요...',
    'tutor.stopSend': '중지 및 전송',
    'tutor.record': '녹음',
    'tutor.send': '보내기',
    'tutor.listen': '듣기',
    'tutor.speakerActive': '스피커 활성 — 마이크 일시중지',
    'tutor.starter.coffee': '카페에서 커피 주문하기',
    'tutor.starter.directions': '길 물어보기',
    'tutor.starter.introduce': '파티에서 자기소개하기',
    'tutor.starter.weekend': '주말 이야기하기',
    'tutor.starter.weather': '날씨에 대해 불평하기',
    'nav.features': '기능',
    'nav.pricing': '요금',
    'nav.about': '소개',
  },
  zh: {
    'tutor.messages': '消息',
    'tutor.corrections': '纠正',
    'tutor.tryScenario': '试试场景',
    'tutor.placeholder': '用{lang}说点什么...',
    'tutor.stopSend': '停止并发送',
    'tutor.record': '录音',
    'tutor.send': '发送',
    'tutor.listen': '听',
    'tutor.speakerActive': '扬声器播放中 — 麦克风暂停',
    'tutor.starter.coffee': '在咖啡馆点咖啡',
    'tutor.starter.directions': '问路',
    'tutor.starter.introduce': '在派对上自我介绍',
    'tutor.starter.weekend': '描述你的周末',
    'tutor.starter.weather': '抱怨天气',
    'nav.features': '功能',
    'nav.pricing': '定价',
    'nav.about': '关于',
  },
  ar: {
    'tutor.messages': 'رسائل',
    'tutor.corrections': 'تصحيحات',
    'tutor.tryScenario': 'جرّب سيناريو',
    'tutor.placeholder': 'قل شيئاً بـ{lang}...',
    'tutor.stopSend': 'إيقاف وإرسال',
    'tutor.record': 'تسجيل',
    'tutor.send': 'إرسال',
    'tutor.listen': 'استمع',
    'tutor.speakerActive': 'مكبر الصوت نشط — الميكروفون متوقف',
    'tutor.starter.coffee': 'اطلب قهوة في مقهى',
    'tutor.starter.directions': 'اسأل عن الاتجاهات',
    'tutor.starter.introduce': 'عرّف عن نفسك في حفلة',
    'tutor.starter.weekend': 'صف عطلة نهاية الأسبوع',
    'tutor.starter.weather': 'تذمّر من الطقس',
    'nav.features': 'المميزات',
    'nav.pricing': 'الأسعار',
    'nav.about': 'عن المنصة',
  },
}

export function detectUILocale(): UILocale {
  const browserLang = navigator.language?.split('-')[0]?.toLowerCase()
  if (browserLang && browserLang in translations) return browserLang as UILocale
  return 'en'
}

let currentLocale: UILocale = detectUILocale()

export function setUILocale(locale: UILocale) {
  currentLocale = locale
}

export function t(key: string, vars?: Record<string, string>): string {
  const dict = translations[currentLocale] || translations.en
  let str = dict[key] || translations.en[key] || key

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v)
    }
  }

  return str
}

export function getStarters(): string[] {
  return [
    t('tutor.starter.coffee'),
    t('tutor.starter.directions'),
    t('tutor.starter.introduce'),
    t('tutor.starter.weekend'),
    t('tutor.starter.weather'),
  ]
}
