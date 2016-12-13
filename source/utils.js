import {interpolateCubehelix} from 'd3-interpolate'
import {scaleLinear} from 'd3-scale'

const color1 = '#F4F7F7'
const color2 = '#ADD8C7'
const colorInterpolateDefault = interpolateCubehelix(color1, color2)
const colorRange = ['#9A262D', '#F7317C', '#F6825B', '#71DC64', '#80D7C8', '#33556E']
const colorInterpolateAirQuality = scaleLinear()
  .domain([0, 0.2, 0.4, 0.5, 0.7, 1])
  .range(colorRange)

module.exports = {colorInterpolateDefault, colorInterpolateAirQuality}
