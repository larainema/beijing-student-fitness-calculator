/**
 * Score tables for the National Student Physical Health Standard (2014 revision)
 * used by Beijing's grades 4, 6 and 8 physical-fitness assessment.
 *
 * This module deliberately has no wx API dependency so its calculation logic can
 * be unit-tested with Node.js and reused by the cloud report service.
 */
const LEVELS = [100, 95, 90, 85, 80, 78, 76, 74, 72, 70, 68, 66, 64, 62, 60, 50, 40, 30, 20, 10]

const ITEM_META = {
  vital: { label: '肺活量', help: '取最好成绩', unit: 'ml', placeholder: '例如 2800', direction: 'higher' },
  sprint: { label: '50 米跑', help: '精确到 0.1 秒', unit: '秒', placeholder: '例如 8.7', direction: 'lower' },
  flexibility: { label: '坐位体前屈', help: '可输入负数，例如 -1.5', unit: 'cm', placeholder: '例如 12.5', direction: 'higher' },
  rope: { label: '1 分钟跳绳', help: '按完成次数录入', unit: '次', placeholder: '例如 130', direction: 'higher' },
  situps: { label: '1 分钟仰卧起坐', help: '按完成次数录入', unit: '次', placeholder: '例如 35', direction: 'higher' },
  shuttle: { label: '50 米 × 8 往返跑', help: '格式为 分:秒，例如 1:48', unit: '分:秒', placeholder: '例如 1:48', direction: 'lower', time: true },
  jump: { label: '立定跳远', help: '取最好成绩', unit: 'cm', placeholder: '例如 185', direction: 'higher' },
  strength: { unit: '次', direction: 'higher' },
  endurance: { help: '格式为 分:秒，例如 4:20', unit: '分:秒', direction: 'lower', time: true }
}

const GRADES = {
  '4': {
    name: '四年级',
    items: ['bmi', 'vital', 'sprint', 'flexibility', 'rope', 'situps'],
    weights: { bmi: 15, vital: 15, sprint: 20, flexibility: 20, rope: 20, situps: 10 },
    sex: {
      male: {
        bmi: { normal: [14.2, 20.1], overweight: 22.6 },
        higher: {
          vital: [2600, 2500, 2400, 2150, 1900, 1820, 1740, 1660, 1580, 1500, 1420, 1340, 1260, 1180, 1100, 1030, 960, 890, 820, 750],
          flexibility: [16.4, 15, 13.6, 11.7, 9.8, 8.6, 7.4, 6.2, 5, 3.8, 2.6, 1.4, 0.2, -1, -2.2, -3.2, -4.2, -5.2, -6.2, -7.2],
          rope: [137, 132, 127, 121, 115, 108, 101, 94, 87, 80, 73, 66, 59, 52, 45, 42, 39, 36, 33, 30],
          situps: [49, 46, 43, 40, 37, 35, 33, 31, 29, 27, 25, 23, 21, 19, 17, 15, 13, 11, 9, 7]
        },
        lower: { sprint: [8.7, 8.8, 8.9, 9, 9.1, 9.3, 9.5, 9.7, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.7, 11.9, 12.1] }
      },
      female: {
        bmi: { normal: [13.7, 19.4], overweight: 22 },
        higher: {
          vital: [2000, 1900, 1800, 1700, 1600, 1530, 1460, 1390, 1320, 1250, 1180, 1110, 1040, 970, 900, 880, 860, 840, 820, 800],
          flexibility: [19.5, 18.1, 16.9, 15, 13.1, 12, 10.9, 9.8, 8.7, 7.6, 6.5, 5.4, 4.3, 3.2, 2.1, 1.3, 0.5, -0.3, -1.1, -1.9],
          rope: [149, 142, 135, 127, 119, 112, 105, 98, 91, 84, 77, 70, 63, 56, 49, 46, 43, 40, 37, 34],
          situps: [47, 45, 43, 40, 37, 35, 33, 31, 29, 27, 25, 23, 21, 19, 17, 15, 13, 11, 9, 7]
        },
        lower: { sprint: [8.7, 8.8, 8.9, 9.2, 9.5, 9.7, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.7, 11.9, 12.1, 12.3, 12.5] }
      }
    }
  },
  '6': {
    name: '六年级',
    items: ['bmi', 'vital', 'sprint', 'flexibility', 'rope', 'situps', 'shuttle'],
    weights: { bmi: 15, vital: 15, sprint: 20, flexibility: 10, rope: 10, situps: 20, shuttle: 10 },
    sex: {
      male: {
        bmi: { normal: [14.7, 21.8], overweight: 24.5 },
        higher: {
          vital: [3200, 3100, 3000, 2750, 2500, 2400, 2300, 2200, 2100, 2000, 1900, 1800, 1700, 1600, 1500, 1410, 1320, 1230, 1140, 1050],
          flexibility: [16.6, 15.3, 14, 11.5, 9, 7.7, 6.4, 5.1, 3.8, 2.5, 1.2, -0.1, -1.4, -2.7, -4, -5, -6, -7, -8, -9],
          rope: [157, 152, 147, 141, 135, 128, 121, 114, 107, 100, 93, 86, 79, 72, 65, 62, 59, 56, 53, 50],
          situps: [51, 48, 45, 42, 39, 37, 35, 33, 31, 29, 27, 25, 23, 21, 19, 17, 15, 13, 11, 9]
        },
        lower: {
          sprint: [8.2, 8.3, 8.4, 8.5, 8.6, 8.8, 9, 9.2, 9.4, 9.6, 9.8, 10, 10.2, 10.4, 10.6, 11.2, 11.4, 11.6, 11.8, 12],
          shuttle: [90, 93, 96, 99, 102, 105, 108, 111, 114, 117, 120, 123, 126, 129, 132, 136, 140, 144, 148, 152]
        }
      },
      female: {
        bmi: { normal: [14.2, 20.8], overweight: 23.6 },
        higher: {
          vital: [2500, 2400, 2300, 2200, 2100, 2010, 1920, 1830, 1740, 1650, 1560, 1470, 1380, 1290, 1200, 1170, 1140, 1110, 1080, 1050],
          flexibility: [19.9, 18.7, 17.5, 15.2, 12.9, 11.8, 10.7, 9.6, 8.5, 7.4, 6.3, 5.2, 4.1, 3, 1.9, 1.1, 0.3, -0.5, -1.3, -2.1],
          rope: [166, 159, 152, 144, 136, 129, 122, 115, 108, 101, 94, 87, 80, 73, 66, 63, 60, 57, 54, 51],
          situps: [49, 47, 45, 42, 39, 37, 35, 33, 31, 29, 27, 25, 23, 21, 19, 17, 15, 13, 11, 9]
        },
        lower: {
          sprint: [8.2, 8.3, 8.4, 8.7, 9, 9.2, 9.4, 9.6, 9.8, 10, 10.2, 10.4, 10.6, 10.8, 11, 11.2, 11.4, 11.6, 11.8, 12],
          shuttle: [97, 100, 103, 106, 109, 112, 115, 118, 121, 124, 127, 130, 133, 136, 139, 143, 147, 151, 155, 159]
        }
      }
    }
  },
  '8': {
    name: '八年级',
    items: ['bmi', 'vital', 'sprint', 'flexibility', 'jump', 'strength', 'endurance'],
    weights: { bmi: 15, vital: 15, sprint: 20, flexibility: 10, jump: 10, strength: 10, endurance: 20 },
    sex: {
      male: {
        strengthName: '引体向上',
        enduranceName: '1000 米跑',
        bmi: { normal: [15.7, 22.5], overweight: 25.2 },
        higher: {
          vital: [3940, 3820, 3700, 3450, 3200, 3080, 2960, 2840, 2720, 2600, 2480, 2360, 2240, 2120, 2000, 1890, 1780, 1670, 1560, 1450],
          flexibility: [19.6, 17.7, 15.8, 13.7, 11.6, 10.3, 9, 7.7, 6.4, 5.1, 3.8, 2.5, 1.2, -0.1, -1.4, -2.6, -3.8, -5, -6.2, -7.4],
          jump: [240, 233, 226, 218, 210, 206, 202, 198, 194, 190, 186, 182, 178, 174, 170, 165, 160, 155, 150, 145],
          strength: [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
        },
        levels: { strength: [100, 95, 90, 85, 80, 76, 72, 68, 64, 60, 50, 40, 30, 20] },
        lower: {
          sprint: [7.5, 7.6, 7.7, 7.8, 7.9, 8.1, 8.3, 8.5, 8.7, 8.9, 9.1, 9.3, 9.5, 9.7, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9],
          endurance: [230, 235, 240, 247, 255, 260, 265, 270, 275, 280, 285, 290, 295, 300, 305, 325, 345, 365, 385, 405]
        },
        bonus: raw => Math.max(0, Math.min(10, Math.floor(raw.strength) - 14)) + bonusFromGap(230 - raw.endurance, [0, 4, 8, 12, 16, 20, 23, 26, 29, 32, 35])
      },
      female: {
        strengthName: '1 分钟仰卧起坐',
        enduranceName: '800 米跑',
        bmi: { normal: [15.3, 22.2], overweight: 24.8 },
        higher: {
          vital: [2900, 2850, 2800, 2650, 2500, 2400, 2300, 2200, 2100, 2000, 1900, 1800, 1700, 1600, 1500, 1460, 1420, 1380, 1340, 1300],
          flexibility: [22.7, 21, 19.3, 17.6, 15.9, 14.6, 13.3, 12, 10.7, 9.4, 8.1, 6.8, 5.5, 4.2, 2.9, 2.1, 1.3, 0.5, -0.3, -1.1],
          jump: [200, 194, 188, 181, 174, 171, 168, 165, 162, 159, 156, 153, 150, 147, 144, 139, 134, 129, 124, 119],
          strength: [51, 49, 47, 44, 41, 39, 37, 35, 33, 31, 29, 27, 25, 23, 21, 19, 17, 15, 13, 11]
        },
        lower: {
          sprint: [8, 8.1, 8.2, 8.5, 8.8, 9, 9.2, 9.4, 9.6, 9.8, 10, 10.2, 10.4, 10.6, 10.8, 11, 11.2, 11.4, 11.6, 11.8],
          endurance: [210, 217, 224, 232, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290, 300, 310, 320, 330, 340]
        },
        bonus: raw => Math.max(0, Math.min(10, Math.floor(raw.strength) - 51)) + bonusFromGap(210 - raw.endurance, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50])
      }
    }
  }
}

function bonusFromGap(gap, steps) {
  let points = 0
  steps.forEach((step, index) => { if (gap >= step) points = index })
  return points
}

function parseTime(value) {
  const input = String(value == null ? '' : value).trim().replace('：', ':')
  if (!input) return null
  if (/^\d+(\.\d+)?$/.test(input)) return Number(input)
  const match = input.match(/^(\d+)\s*:\s*(\d{1,2}(?:\.\d+)?)$/)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = (seconds - minutes * 60).toFixed(1).replace(/\.0$/, '').padStart(2, '0')
  return `${minutes}:${rest}`
}

function scoreHigher(value, thresholds, levels = LEVELS) {
  for (let i = 0; i < thresholds.length; i += 1) if (value >= thresholds[i]) return levels[i]
  return 0
}

function scoreLower(value, thresholds) {
  for (let i = 0; i < thresholds.length; i += 1) if (value <= thresholds[i]) return LEVELS[i]
  return 0
}

function scoreBmi(value, rule) {
  if (value >= rule.normal[0] && value <= rule.normal[1]) return 100
  return value <= rule.overweight ? 80 : 60
}

function convertToBeijingScore(score) {
  if (score >= 80) return 10
  if (score >= 75) return 8.5
  if (score >= 70) return 8
  if (score >= 65) return 7.5
  if (score >= 60) return 7
  return 5.5
}

function category(score) {
  if (score >= 80) return '良好及以上 · 统测满分'
  if (score >= 75) return '及格 · 接近良好'
  if (score >= 60) return '及格 · 可继续提升'
  return '不及格 · 建议加强练习'
}

function itemLabel(key, sexData) {
  if (key === 'strength') return sexData.strengthName
  if (key === 'endurance') return sexData.enduranceName
  return ITEM_META[key].label
}

function formItems(grade, sex) {
  const gradeData = GRADES[grade]
  const sexData = gradeData.sex[sex]
  return gradeData.items.filter(key => key !== 'bmi').map(key => {
    const meta = ITEM_META[key]
    const label = itemLabel(key, sexData)
    const help = key === 'strength' ? (sexData.strengthName === '引体向上' ? '按完成次数录入' : '1 分钟完成次数') : meta.help
    const placeholder = key === 'strength'
      ? (sexData.strengthName === '引体向上' ? '例如 10' : '例如 42')
      : key === 'endurance'
        ? (sexData.enduranceName === '1000 米跑' ? '例如 4:20' : '例如 4:05')
        : meta.placeholder
    return { key, label, help, unit: meta.unit, placeholder, time: Boolean(meta.time) }
  })
}

function calculate({ grade, sex, values }) {
  const gradeData = GRADES[grade]
  if (!gradeData || !gradeData.sex[sex]) throw new Error('Unsupported grade or sex')
  const sexData = gradeData.sex[sex]
  const height = Number(values.height)
  const weight = Number(values.weight)
  const bmi = height > 0 && weight > 0 ? weight / ((height / 100) ** 2) : null
  const required = gradeData.items.filter(key => key !== 'bmi')
  const raw = {}
  required.forEach(key => { raw[key] = ITEM_META[key].time ? parseTime(values[key]) : Number(values[key]) })
  const complete = bmi !== null && required.every(key => String(values[key] == null ? '' : values[key]).trim() !== '') && Object.values(raw).every(Number.isFinite)
  if (!complete) return { complete: false, bmi, missing: required }

  const items = gradeData.items.map(key => {
    if (key === 'bmi') return { key, label: 'BMI', raw: bmi.toFixed(1), score: scoreBmi(bmi, sexData.bmi) }
    const meta = ITEM_META[key]
    const thresholds = meta.direction === 'higher' ? sexData.higher[key] : sexData.lower[key]
    const score = meta.direction === 'higher'
      ? scoreHigher(raw[key], thresholds, (sexData.levels && sexData.levels[key]) || LEVELS)
      : scoreLower(raw[key], thresholds)
    return { key, label: itemLabel(key, sexData), raw: meta.time ? formatTime(raw[key]) : `${raw[key]} ${meta.unit}`, score }
  })

  const standard = items.reduce((total, item) => total + item.score * gradeData.weights[item.key] / 100, 0)
  const bonus = grade === '8'
    ? sexData.bonus(raw)
    : Math.max(0, Math.min(20, Math.floor((raw.rope - sexData.higher.rope[0]) / 2)))
  const national = Math.min(120, standard + bonus)
  const converted = convertToBeijingScore(national)
  const knowledge = Number(values.knowledge)
  const hasKnowledge = grade === '8' && String(values.knowledge == null ? '' : values.knowledge).trim() !== '' && Number.isFinite(knowledge)
  const knowledgeConverted = hasKnowledge ? convertToBeijingScore(Math.max(0, Math.min(120, knowledge))) : null

  return {
    complete: true,
    bmi,
    items: items.map(item => ({ ...item, contribution: item.score * gradeData.weights[item.key] / 100 })),
    standard,
    bonus,
    national,
    converted,
    category: category(national),
    knowledgeConverted,
    process: grade === '8' && hasKnowledge ? converted + knowledgeConverted : null
  }
}

module.exports = { GRADES, ITEM_META, calculate, formItems, parseTime, convertToBeijingScore }
