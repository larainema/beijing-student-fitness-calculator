const assert = require('assert')
const { calculate } = require('../utils/fitness')
const { buildReport } = require('../utils/report')

const scenarios = [
  {
    grade: '4', sex: 'male',
    values: { height: '135', weight: '31', vital: '2200', sprint: '9.5', flexibility: '10', rope: '120', situps: '32' }
  },
  {
    grade: '6', sex: 'female',
    values: { height: '150', weight: '39', vital: '2250', sprint: '9.2', flexibility: '14', rope: '150', situps: '40', shuttle: '1:58' }
  },
  {
    grade: '8', sex: 'male',
    values: { height: '168', weight: '56', vital: '3200', sprint: '8.8', flexibility: '9.5', jump: '205', strength: '11', endurance: '4:18', knowledge: '82' }
  }
]

scenarios.forEach(scenario => {
  const calculation = calculate(scenario)
  assert.equal(calculation.complete, true)
  assert.ok(calculation.items.every(item => Number.isFinite(item.value)))
  const report = buildReport({ ...scenario, calculation })
  assert.equal(report.details.length, calculation.items.length)
  assert.ok(report.details.every(item => item.target && item.target.text))
  assert.ok(Number.isFinite(report.converted))
})

console.log('Fitness calculation and local report tests passed.')
