import {selection, select, selectAll} from 'd3-selection'
import {scaleLinear} from 'd3-scale'
import {line, curveMonotoneY} from 'd3-shape'
import {polygonHull, polygonContains} from 'd3-polygon'

import {colorInterpolateDefault, colorInterpolateAirQuality} from './utils'

const customColor = true // use air quality as color if true, default to winter colors if false

const w = 700
const h = 979
const center = {x: w / 2, y: h / 2}
const outputW = 113 // in millimeters
const outputH = (h / w) * outputW

const flakePadding = 20
const edgePadding = 30

const animationW = 200
const animationH = Math.ceil((h / w) * animationW)

// segement width to test for hull intersections,
// smaller n is more accurate, but takes longer to render
const segmentW = 2
const yIncrement = (h / w) * segmentW // angles background lines corner to corner
const backgroundLineSpacing = 35
const backgroundLineIterations = h / backgroundLineSpacing

const path = line()
  .x(d => d[0])
  .y(d => d[1])
  .curve(curveMonotoneY)

export default class Snowflake {
  constructor(data, drawBackground = false, explainer = false) {
    this._data = data
    this._pts = [[0,0]] //used to calculate convex hull
    this._radialIterations = this._data['Length of Relationship'] || defualtRadialIterations
    this._isExplainer = explainer

    this._initSvg()
    if (this._isExplainer) {
      this._drawBackgroundCircle()
    }
    this._initRadialGroups()
    this._initAxialGroups()
    this._drawSnowflake()
    if (drawBackground) {
      this._drawBackgroundPattern()
    }

  }

  _initSvg() {
    const container = this._isExplainer ? '.explainer' : 'body'
    const className = this._isExplainer ? 'explainerFlake' : 'svgContainer'
    this._container = select(container)
      .append('span')
      .attr('data-name', this._data['Index'])
      .attr('class', className)
    this._svg = this._container.append('svg')
      .attr('xmlns','http://www.w3.org/2000/svg')
      .attr('viewBox', `0 0 ${w} ${h}`)
    if (this._isExplainer) {
      this._svg
        .attr('height', `${h}px`)
        .attr('width', `${w}px`)
    } else {
      this._svg
        .attr('width', `${outputW}mm`)
        .attr('height', `${outputH}mm`)
    }
  }

  _drawBackgroundCircle() {
    this._svg.append('circle')
      .attr('cx', center.x)
      .attr('cy', center.y)
      .attr('r', w / 2 - 1)
      .attr('fill', 'rgba(255,255,255,0.9)')
      .attr('stroke', colorInterpolateAirQuality(this._data['Air Quality Alpha']))
  }

  _initRadialGroups() {
    this._randomRotation = Math.random() * 360
    for (let i = 1; i <= this._radialIterations; i ++) {
      const rotate = i * (360 / this._radialIterations) + this._randomRotation
      this._svg.append('g')
        .attr('class', 'radialG')
        .attr('transform', `translate(${center.x},${center.y})rotate(${rotate})`)
    }
    this._radialGroups = this._svg.selectAll('.radialG')
  }

  _initAxialGroups() {
    this._radialGroups
      .append('g')
      .attr('class', 'axialG')
    this._radialGroups
      .append('g')
      .attr('class', 'axialG')
      .attr('transform', 'scale(-1,1)')
    this._axialGroups = this._svg.selectAll('.axialG')
  }

  _drawLine(x1, y1, x2, y2, groupSelector, label) {
    const defaultColor = colorInterpolateDefault(Math.random())
    const airQualityColor = colorInterpolateAirQuality(this._data['Air Quality Alpha'])
    groupSelector.append('g')
      .attr('inkscape:label',`${label}-line`)
      .attr('inkscape:groupmode', 'layer')
      .append('path')
      .attr('d', `M ${x1} ${y1} L ${x2} ${y2}`)
      .attr('stroke', customColor ? airQualityColor : defaultColor)
    this._addToHull([this._getPadding(x1), this._getPadding(y1)])
    this._addToHull([this._getPadding(x2), this._getPadding(y2)])
  }

  _addToHull(pt) {
    this._pts.push([this._getPadding(pt[0]), this._getPadding(pt[1])])
  }

  _drawRadialLine(x1, y1, x2, y2) {
    this._drawLine(x1, y1, x2, y2, this._radialGroups, 1)
  }

  _drawAxialLine(x1, y1, x2, y2) {
    this._drawLine(x1, y1, x2, y2, this._axialGroups, 1)
  }

  _drawAxialCurve(coords, fill = false, label = 1) {
    const defaultColor = colorInterpolateDefault(Math.random())
    const airQualityColor = colorInterpolateAirQuality(this._data['Air Quality Alpha'])
    if (fill) {
      coords = coords.concat([coords[0]])
    }
    this._axialGroups
      .append('g')
      .attr('inkscape:label',`${label}-curve`)
      .attr('inkscape:groupmode', 'layer')
      .append('path')
      .attr('d', path(coords))
      .attr('stroke', customColor ? airQualityColor : defaultColor)
      .attr('fill', fill ? customColor ? airQualityColor : defaultColor : 'none')
  }

  _drawAirQualityLines(minDistance, maxDistance, metric) {
    for (let i = 0; i < 3; i ++) {
      let y = Math.random() * (maxDistance - minDistance) + minDistance
      let x1 = metric / Math.pow(i + 1, i)
      this._drawAxialLine(0, y, x1, y)
    }
  }

  _drawRandomAxialWave(length, segments, amplitude, variable = false) {
    /** creates random undulating curve along radial segment */
    if (variable) {
      segments += Math.round(Math.random()) // increments the segment n by 1 or 0
    }
    const coords = []
    for (let i = 0; i < segments; i ++) {
      const minStartingValue = Math.random() * (amplitude - 8) + 8 // keep small space in center
      coords.push([
        i === 0 ? minStartingValue : (i + 1) % 2 ? Math.random() * amplitude : 0,
        0 + (i * length / segments)
      ])
    }
    this._drawAxialCurve(coords, false, 1)
    coords.forEach(coord => {this._addToHull(coord)})
  }

  _drawSnowflake() {
    // one radial line is nice to anchor the shape visually, pass just y values
    const airQuality = this._data['Air Quality Scaled']
    // one radial line is nice to anchor the shape visually, pass just y values
    this._drawRadialLine(0, 30, 0, 250)

    this._drawAirQualityLines(30, 165, airQuality) // creates the squared jewel effect

    this._drawRandomAxialWave(100, 3, 140)
    this._drawRandomAxialWave(180, 2, 60, true)
    this._drawRandomAxialWave(250, 8, 25)
    this._drawRandomAxialWave(200, 7, 40)

    if (this._radialIterations < 7) {
      this._drawRandomAxialWave(135, 5, 90, true)
    }
  }

  _drawBackgroundPattern() {
    const hulls = this._getSnowflakeHulls()
    const drawHulls = false
    if (drawHulls) {
      this._drawHulls(hulls)
    }

    this._bg = this._svg.append('g')
      .attr('inkscape:label','2-line')
      .attr('inkscape:groupmode', 'layer')
      .append('path')
      .attr('d', this._getBackgroundPath(hulls))
      .attr('stroke', 'red')
      .attr('fill', 'none')
  }

  _getBackgroundPath(hulls) {
    /** generates zig-zagged background around hulls */
    let rows = []
    for (let i = Math.floor(-backgroundLineIterations); i < backgroundLineIterations; i ++) {
      rows.push({
        row: i,
        line: []
      })
      let y = (i * backgroundLineSpacing)
      for (let j = 0; j < w / segmentW; j ++) {
        const x1 = j * segmentW
        const y1 = y
        const x2 = x1 + segmentW
        const y2 = y1 + yIncrement
        y = y2 //increment y for angled lines
        const intersects = this._intersectsHulls(hulls, [[x1, y1], [x2, y2]])
        const inBounds = this._isInBounds([[x1, y1], [x2, y2]])
        //add line if it doesn't intersect and is in bounds
        if (!intersects && inBounds) {
          rows.find(d => d.row === i).line.push([x1, y1], [x2, y2])
        }
      }
    }
    rows = rows.filter(row => row.line.length > 0)
    rows.forEach((row, index) => {
      if (index % 2) { row.line.reverse() } //reverse for zigzag effect
      row.line = this._returnPtSingletons(row.line)
        .reduce((a,b,idx) => {
          if (idx % 2) {
            return `${a} L ${b[0]} ${b[1]}`
          } else {
            return (idx === 0) ? `${b[0]} ${b[1]}` : `${a} M ${b[0]} ${b[1]}`
          }
      }, '')
    })
    return rows.reduce((a,b,idx) => {
      return (idx === 0) ? `M ${b.line}`: `${a} L ${b.line}`
    }, '')
  }

  _getPadding(n) {
    if (n > 0) {
      return n + flakePadding
    } else if (n < 0) {
      return n - flakePadding
    }
    return n
  }

  _intersectsHulls(hulls, line) {
    return hulls.find(hull =>
      polygonContains(hull, line[0]) || polygonContains(hull, line[1])
    )
  }

  _isInBounds(line) {
    return (
      line[0][0] >= 0 + edgePadding && line[0][0] <= w - edgePadding &&
      line[1][0] >= 0 + edgePadding && line[1][0] <= w - edgePadding &&
      line[0][1] >= 0 + edgePadding && line[0][1] <= h - edgePadding &&
      line[1][1] >= 0 + edgePadding && line[1][1] <= h - edgePadding
    )
  }

  _returnPtSingletons(arr) {
    /** only return points that don't have dupes (interior points are culled) */
    return arr.reduce((a,b,idx) => {
      const valueExists = arr.some((d, i) => d[0] === b[0] && d[1] === b[1] && i !== idx)
      return valueExists ? a : a.concat([b])
    }, [])
  }

  _getSnowflakeHulls() {
    /** return convex hulls for each snowflake spike */
    const spikeHull = polygonHull(this._pts.concat(this._pts.map(pt => [ 0 - pt[0], pt[1] ])))
    const hulls = []
    for (let i = 0; i < this._radialIterations; i ++) {
      const rotation =  i * (360 / this._radialIterations) - this._randomRotation
      hulls.push(
        spikeHull
          .map(pt => this._getPtRotation(rotation, pt)) // rotate hull
          .map(pt => [pt[0] + w / 2, pt[1] + h / 2]) // translate to top left coords
      )
    }
    return hulls
  }

  _drawHulls(hulls) {
    hulls.forEach(hull => {
     const hullPath = `M ${hull.join('L')} Z`
     this._svg.append('path')
       .attr('d', hullPath)
       .attr('stroke', 'yellow')
       .attr('fill', 'none')
   })
  }

  _getPtRotation(theta, pt) {
    const rad = (Math.PI / 180) * theta
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return ([
      (cos * pt[0]) + (sin * pt[1]),
      (cos * pt[1]) - (sin * pt[0])
    ])
  }

  beginAnimation() {
    if (this._bg) {
      this._bg.remove()
    }
    this._position = [Math.random() * window.innerWidth, Math.random() * window.innerHeight]
    this._velocity = [Math.random() * 10, Math.random() * 5]
    this._rotation = 0
    this._rotationVelocity = (Math.random() - 0.5) * 0.2
    const img = new Image()
    const svg = new Blob([this._container.html()], {type: 'image/svg+xml'})
    const DOMUrl = window.URL || window.webkitURL || window
    return new Promise((resolve, reject) => {
      img.onload = () => {
        console.log('loaded')
        const c = document.createElement('canvas')
        c.width = animationW
        c.height = animationH
        const privateCtx = c.getContext('2d')
        privateCtx.drawImage(img, 0, 0, animationW, animationH)
        const i = new Image()
        i.onload = () => {
          resolve(i)
          this._image = i
        }
        i.src = c.toDataURL()

      }
      img.onerror = (e) => {
        console.log('error')
        console.log(e)
      }
      const url = 'data:image/svg+xml,' + encodeURIComponent(this._container.html())
      img.src = url
    })
  }

  resize(oldW, oldH, newW, newH) {
    this._position[0] = this._position[0] / oldW * newW
    this._position[1] = this._position[1] / oldH * newH
  }

  animate(ctx, w, h, wind) {
    this._velocity[0] += wind
    this._velocity[1] += 0.01
    this._velocity[0] = Math.min(this._velocity[0], 5)
    this._velocity[0] = Math.max(this._velocity[0], -5)

    this._position[0] += this._velocity[0]
    this._position[1] += this._velocity[1]

    this._rotationVelocity += wind * 0.001
    this._rotationVelocity = Math.min(Math.max(this._rotationVelocity, -0.01),0.01)
    this._rotation += this._rotationVelocity

    while (this._position[0] < 0 - animationW) {
      this._position[0] += (w + animationW)
    }
    while (this._position[0] > w) {
      this._position[0] -= (w + animationW)
    }
    while (this._position[1] > h) {
      this._position[0] = Math.random() * w
      this._position[1] -= (h + animationH)
      this._velocity[1] = Math.random() * 5
    }

    ctx.save()
    ctx.translate(this._position[0] + animationW / 2, this._position[1] + animationH / 2)
    ctx.rotate(this._rotation)
    ctx.drawImage(this._image, -animationW/2, -animationH/2, animationW, animationH)
    ctx.restore()
  }
}
