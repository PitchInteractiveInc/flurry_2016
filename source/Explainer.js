import Hammer from 'hammerjs'
import {select, selectAll} from 'd3-selection'
import {transition, active} from 'd3-transition'
import Snowflake from './Snowflake'
import {colorInterpolateAirQuality} from './utils'
import recipients from 'csv?header=true!./data/recipients.csv'

class Explainer {
  constructor(randomRecipient) {
    this._animationRunning = false
    this._currentAnimationIndex = 0

    select('.background').append('div')
      .attr('class', 'explainer')
      .style('opacity', 0)
    this._buttons = select('body').append('div').attr('class', 'buttons')
    this._aboutButton = select('.about')

    this._aboutButton.on('click', () => {
      if (!this._animationRunning) {
        this._beginAnimation()
      } else {
        this._stopAnimation()
      }
    })

    this._animate = this._animate.bind(this)
    this._sequenceNextAnimation = this._sequenceNextAnimation.bind(this)
    this._sequencePreviousAnimation = this._sequencePreviousAnimation.bind(this)
    this._startUniqueAnimation = this._startUniqueAnimation.bind(this)
    this._keyListener = this._keyListener.bind(this)

    window.onkeydown = this._keyListener

    this._generateUniqueSnowflake()
    this._initTextBoxes()
    this._initButtons()
    this._initMakingImage()

    this._resizeImage = this._resizeImage.bind(this)
    this._positionScrollArrows = this._positionScrollArrows.bind(this)
    window.onresize = () => {
      this._positionScrollArrows()
      this._resizeImage()
    }
  }

  _initTextBoxes() {
    select('.explainer')
      .append('div')
      .attr('class', 'text-box explainer-points')
      .style('opacity', 0)
      .text(`The number of points on the snowflake represents how long we've known them.`)
    select('.explainer')
      .append('div')
      .attr('class', 'text-box explainer-color')
      .style('opacity', 0)
      .text(`The color of the snowflake is determined by the air quality in their location.`)
    select('.explainer')
      .append('div')
      .attr('class', 'text-box explainer-unique')
      .style('opacity', 0)
      .text(`Every snowflake is unique and reflects the person we sent it to.`)
    select('.explainer')
      .append('div')
      .attr('class', 'text-box explainer-happy')
      .style('opacity', 0)
      .text(`Enjoy the snowflakes. Happy holidata!`)
  }

  _initButtons() {
    const next = select('.explainer')
      .append('div')
      .attr('class', 'arrow next-button')
      .on('click', this._sequenceNextAnimation)
    const prev = select('.explainer')
      .append('div')
      .attr('class', 'arrow back-button')
      .on('click', this._sequencePreviousAnimation)

    // set up touch
    const mc = new Hammer(document.getElementById('stage'))
    mc.on("swipeleft", () => {
      if (!this._animationRunning) {
        this._beginAnimation()
      } else if (this._currentAnimationIndex < 3) {
        this._sequenceNextAnimation()
      }
    })
    mc.on("swiperight", () => {
      if (this._animationRunning) {
        this._sequencePreviousAnimation()
      }
    })
  }

  _initMakingImage() {
    select('.explainer')
      .append('div')
      .attr('class', 'making-image')
      .style('opacity', 0)
    this._positionScrollArrows()
  }

  _keyListener(e) {
    const code = e.keyCode ? e.keyCode : e.which;
    if (code === 39) { //right arrow key
      if (!this._animationRunning) {
        this._beginAnimation()
      } else if (this._currentAnimationIndex < 3) {
        this._sequenceNextAnimation()
      }
    } else if (code === 37) { //left arrow key
      if (this._animationRunning) {
        this._sequencePreviousAnimation()
      }
    }
  }

  _getScaledSnowFlakeWidth() {
    const height = window.innerHeight
    const width = window.innerWidth
    if ((width / height) < (700 / 900)) {
      return window.innerWidth * (0.85) // matches max svg width in main.scss
    }
    return (window.innerHeight * (700 / 979)) > 700 ? 700 : window.innerHeight * (700 / 979) // matches w/h in Snowflake.js
  }

  _positionScrollArrows() {
    const width = this._getScaledSnowFlakeWidth()
    const r = width / 2
    const explainerW = select('.explainer').node().getBoundingClientRect().width
    let position = 50 - (r / (explainerW) * 100) - 8
    if (position < 1) {position = 1}
    select('.next-button').style('right', `${position}%` )
    select('.back-button').style('left', `${position}%` )
  }

  _resizeImage() {
    const width = this._getScaledSnowFlakeWidth()
    const r = width / 2 + 2
    select('.making-image')
      .style('width', `${r * 2}px`)
      .style('height', `${r * 2}px`)
  }

  _beginAnimation() {
    this._animationRunning = true
    select('.explainer').style('opacity', 1)
    select('.background').style('background', 'rgba(255,255,255,0.7)');
    this._toggleMessage()
    window.setTimeout(this._animate, 1000)
  }

  _stopAnimation() {
    this._animationRunning = false
    select('.background').style('background', 'rgba(255,255,255,0)');
    this._stopAllAnimations()
    this._toggleMessage()
  }

  _toggleMessage() {
    select('.message').classed('slide-left', this._animationRunning)
    select('.explainer').classed('centered', this._animationRunning)
    this._currentAnimationIndex = 0
  }

  _stopAllAnimations() {
    clearTimeout(this._uniqueTimeout)
    this._stopSpikeAnimation()
    this._stopColorAnimation()
  }

  _sequenceNextAnimation() {
    this._currentAnimationIndex ++
    this._animate()
  }

  _sequencePreviousAnimation() {
    this._currentAnimationIndex --
    this._animate()
  }

  _animate() {
    const idx = this._currentAnimationIndex
    this._stopAllAnimations()
    this._hideAll()
    this._fadeNextButton(false)
    if (idx < 0) {
      //resets
      this._stopAnimation()
    } else if (idx === 0) {
      this._show('.explainer-unique')
      this._startUniqueAnimation()
    } else if (idx === 1) {
      this._show('.explainer-color')
      this._startColorAnimation()
    } else if (idx === 2) {
      this._show('.explainer-points')
      this._startSpikeAnimation()
    } else if (idx === 3) {
      this._fadeNextButton(true)
      this._resizeImage()
      this._show('.explainer-happy')
      this._show('.making-image')
    }
  }

  _show(selector) {
    select(selector)
      .style('opacity', 1)
  }

  _hideAll() {
    selectAll('.text-box, .making-image')
      .style('opacity', 0)
  }

  _fadeNextButton(bool) {
    select('.next-button')
      .classed('faded', bool)
  }

  _startSpikeAnimation() {
    selectAll('.explainerFlake .radialG')
      .attr('opacity', 1)
      .transition()
      .duration(400)
      .delay((d, i) => i * 150)
      .on('start', function repeat() { // http://bl.ocks.org/mbostock/70d5541b547cc222aa02
        active(this)
          .attr('opacity', 0)
          .transition()
          .duration(400)
          .attr('opacity', 1)
          .transition()
          .delay(5 * 300)
          .on('start', repeat)
      })
  }

  _stopSpikeAnimation() {
    selectAll('.explainerFlake .radialG')
      .transition()
      .duration(0)
      .delay(0)
      .attr('opacity', 1) // stop spike animation
  }

  _startColorAnimation() {
    const colors = [0,0.25,1].map(c => colorInterpolateAirQuality(c))
    selectAll('.explainerFlake path, .explainerFlake circle')
      .transition()
      .duration(400)
      .delay(500)
      .on('start', function repeat() {
        active(this)
          .style('stroke', colors[0])
          .transition()
          .delay(500)
          .style('stroke', colors[1])
          .transition()
          .delay(500)
          .style('stroke', colors[2])
          .transition()
          .delay(500)
          .on('start', repeat)
      })
  }

  _stopColorAnimation() {
    selectAll('.explainerFlake path, .explainerFlake circle')
      .style('stroke', null)
      .interrupt()
  }

  _startUniqueAnimation() {
    this._generateUniqueSnowflake()
    this._uniqueTimeout = window.setTimeout(this._startUniqueAnimation, 2500)
  }

  _generateUniqueSnowflake() {
    select('.explainerFlake').remove()
    const randomData = {
      'Air Quality Scaled': Math.random() * 100 + 60,
      'Air Quality Alpha': Math.random(),
      'Length of Relationship': Math.ceil(Math.random() * 5) + 4,
    }
    new Snowflake(randomData, false, true)
  }
}

export default Explainer
