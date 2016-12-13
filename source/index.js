import {scaleLinear} from 'd3-scale'
import {extent} from 'd3-array'
import {select, selectAll} from 'd3-selection'

import recipients from 'csv?header=true!./data/recipients.csv'
import Snowflake from './Snowflake'
import css from './css/main.scss'
import Exporter from './Exporter'
import Animator from './Animator'
import Explainer from './Explainer'

import seedrandom from 'seedrandom'
Math.seedrandom('happy holidata')

const airQualityScale = scaleLinear()
  .domain(extent(recipients, recipient => +recipient['Air Quality'] || 0))
  .rangeRound([60, 160])
  .clamp(true)
  .nice()

const airQualityAlphaScale = scaleLinear()
  .domain(extent(recipients, recipient => +recipient['Air Quality'] || pitchAirQuality))
  .range([0, 1])

const pitchAirQuality = 22

const drawCards = location.search === '?cards'

const snowflakes = recipients.map(recipient => {
  recipient['Length of Relationship'] = parseInt(recipient['Length of Relationship']) + 1 || 5
  recipient['Air Quality Alpha'] = airQualityAlphaScale(recipient['Air Quality'] || pitchAirQuality)
  recipient['Air Quality Scaled'] = airQualityScale(recipient['Air Quality'] || pitchAirQuality)
  return new Snowflake(recipient, drawCards)
})

if (!drawCards) {
  Animator.setFlakes(snowflakes)
  Animator.beginAnimation()
  new Explainer()
} else {
  selectAll('.background, .buttons').style('display', 'none')
}
