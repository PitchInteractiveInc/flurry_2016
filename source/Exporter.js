import JSZip from 'jszip'
import {select, selectAll} from 'd3-selection'
import {saveAs} from 'file-saver'

class Exporter {
  constructor() {
    this._button = select('body').append('div').append('button').text('export')
    this._button.on('click', this._export.bind(this))
  }

  _export() {
    const containers = selectAll('.svgContainer')
    console.log(containers)
    const zip = new JSZip()
    const self = this
    containers.each(function(d, i) {
      const container = select(this)
      const name = container.attr('data-name')
      let data = container.html()
      data = self._fixAttributes(data)
      zip.file(`${name}.svg`, data)
    })
    zip.generateAsync({type: 'blob'}).then(blob => {
      saveAs(blob, 'svgs.zip')
    })
  }

  _fixAttributes(data) {
    const fixes = [
      [/label/g, 'inkscape:label'],
      [/groupmode/g, 'inkscape:groupmode']
    ]

    fixes.forEach((fix) => {
      data = data.replace(fix[0], fix[1])
    })
    return data
  }
}

export default new Exporter()
