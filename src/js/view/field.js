import {Texture, Sprite, Stage} from 'pixi.js'
import {range} from 'lodash'
import {EventEmitter2} from 'eventemitter2'

import * as CellState from '../const/cellstate'

const MINE_SIZE = 16

class Cell extends Sprite {
  constructor() {
    super(Texture.fromFrame('cell.close'), MINE_SIZE, MINE_SIZE);
    this.interactive = true;
  }
}

export default class Field extends Stage {
  constructor(fieldWidth, fieldHeight) {
    super(0x888888)

    this.emitter = new EventEmitter2
    this.fieldWidth = fieldWidth
    this.fieldHeight = fieldHeight

    this.isMouseLeftDown = false
    this.isMouseRightDown = false

    this.cells = range(fieldWidth * fieldHeight)
    .map(n => {
      const cell = new Cell
      cell.position.x = MINE_SIZE * (n % fieldWidth)
      cell.position.y = MINE_SIZE * Math.floor(n / fieldWidth)
      return cell
    })
    this.cells.forEach(cell => this.addChild(cell))
  }

  getHoveredCellPosition() {
    let mousePosition = this.getMousePosition()
    return {
      x: Math.floor(mousePosition.x / MINE_SIZE),
      y: Math.floor(mousePosition.y / MINE_SIZE)
    }
  }

  /**
   * @override
   */
  mouseout() {
    this.isMouseLeftDown = false
    this.isMouseRightDown = false
  }

  /**
   * @override
   */
  mousedown() {
    this.isMouseLeftDown = true
  }

  /**
   * @override
   */
  mouseup() {
    if (this.isMouseLeftDown && this.isMouseRightDown) {
      this.emitter.emit('click:twin', this.getHoveredCellPosition())
    } else if (this.isMouseLeftDown) {
      this.emitter.emit('click:left', this.getHoveredCellPosition())
    }
    this.isMouseLeftDown = false
  }

  /**
   * @override
   */
  rightup() {
    if (this.isMouseLeftDown && this.isMouseRightDown) {
      this.emitter.emit('click:twin', this.getHoveredCellPosition())
    }
    this.isMouseRightDown = false
  }

  /**
   * @override
   */
  rightdown() {
    if (!this.isMouseLeftDown) {
      this.emitter.emit('click:right', this.getHoveredCellPosition())
    }
    this.isMouseRightDown = true
  }

  on(...args) {
    this.emitter.on.apply(this.emitter, args)
  }

  setCellTexture(x, y, texture) {
    this.cells[x + y * this.fieldWidth].setTexture(texture)
  }

  update(cellModels) {
    const mousePosition = this.getMousePosition()
    const x = Math.floor(mousePosition.x / 16)
    const y = Math.floor(mousePosition.y / 16)

    cellModels.forEach(cell => {
      let frameName = ''
      switch (cell.state) {
        case CellState.OPEN:
          if (cell.isMine) {
            frameName = cell.clickedMine ? 'cell.mine_red' : 'cell.mine'
          } else if (cell.neighborMineCount === 0) {
            frameName = 'cell.empty'
          } else {
            frameName = `cell.number_${cell.neighborMineCount}`
          }
          break;
        case CellState.CLOSE:
          if (this.isMouseLeftDown && cell.x === x && cell.y === y) {
            frameName = 'cell.empty'
          } else {
            frameName = 'cell.close'
          }
          break;
        case CellState.FLAG:
          frameName = 'cell.close_flag'
          break;
      }
      this.setCellTexture(cell.x, cell.y, Texture.fromFrame(frameName))
    })
  }
}
