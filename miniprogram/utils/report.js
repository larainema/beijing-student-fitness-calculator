const { GRADES, nextScoreTarget } = require('./fitness')

function gradeLabel(grade) {
  return GRADES[grade].name
}

function buildReport({ grade, sex, calculation }) {
  if (!calculation || !calculation.complete) throw new Error('INCOMPLETE_CALCULATION')
  const sexLabel = sex === 'male' ? '男生' : '女生'
  const details = calculation.items.map(item => ({
    ...item,
    contributionText: item.contribution.toFixed(1),
    target: nextScoreTarget({ grade, sex, item })
  }))
  const priorities = details
    .filter(item => !item.target.reached)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)

  return {
    grade,
    gradeLabel: gradeLabel(grade),
    sexLabel,
    converted: calculation.converted,
    category: calculation.category,
    bmiText: calculation.bmi.toFixed(1),
    standardText: calculation.standard.toFixed(1),
    nationalText: calculation.national.toFixed(1),
    bonusText: `+${calculation.bonus}`,
    processText: calculation.process === null ? '' : calculation.process.toFixed(1),
    hasProcess: grade === '8' && calculation.process !== null,
    details,
    priorities,
    summary: priorities.length
      ? `优先关注 ${priorities.map(item => item.label).join('、')}，每次测试都以学校或区级统测记录为准。`
      : '各项目已达到当前评分表中的较高水平，建议保持规律练习。'
  }
}

module.exports = { buildReport }
