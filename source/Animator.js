import {select, selectAll} from 'd3-selection'
import stats from 'stats.js'


class Animator {
  constructor() {
    this._animate = this._animate.bind(this)
    this._stats = new stats()

    this._w = window.innerWidth
    this._h = window.innerHeight

    this._canvas = select('body').append('canvas')
      .attr('width', this._w)
      .attr('height', this._h)
      .style('display','none')
    this._ctx = this._canvas.node().getContext('2d')

    this._stats.dom.style.left = null
    this._stats.dom.style.right = '0px'
    // document.body.appendChild(this._stats.dom)
    this._mouseX = 0
    document.addEventListener('mousemove', this._mouseMoved.bind(this))
    window.addEventListener('resize', this._resize.bind(this))
    this._canvasNeedsResize = false
    window.addEventListener('deviceorientation', this._handleMotion.bind(this))
  }

  setFlakes(_flakes) {
    this._flakes = _flakes
  }

  _mouseMoved(e) {
    this._mouseX = e.clientX
  }

  _handleMotion(e) {
    console.log(e.alpha)
  }

  _resize() {
    this._w = window.innerWidth
    this._h = window.innerHeight
    this._canvasNeedsResize = true
  }

  beginAnimation() {
    select('body').classed('animating', true)
    this._canvas.style('display','block')
    Promise.all(this._flakes.map(flake => flake.beginAnimation()))
      .then(results => {
        console.log('loaded')
        this._animate()
      })
  }

  _animate() {
    window.requestAnimationFrame(this._animate)
    if (this._canvasNeedsResize) {
      const oldW = this._canvas.attr('width')
      const oldH = this._canvas.attr('height')
      this._canvasNeedsResize = false
      this._canvas
        .attr('width', this._w)
        .attr('height', this._h)
      this._flakes.forEach(flake => {
        flake.resize(oldW, oldH, this._w, this._h)
      })
    }
    this._ctx.clearRect(0, 0, this._w, this._h)
    this._stats.begin()
    const wind = (this._mouseX - this._w/2) / this._w * 0.1
    this._flakes.forEach(flake =>
      flake.animate(this._ctx, this._w, this._h, wind)
    )
    this._stats.end()

  }
}

export default new Animator()
