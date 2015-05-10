import {Texture, Sprite, Stage} from 'pixi.js'
import {range} from 'lodash'
import {EventEmitter2} from 'eventemitter2'

import mixin from '../util/mixin'
import * as CellState from '../const/cellstate'

const MINE_SIZE = 16

class Cell extends Sprite {
  constructor() {
    super(Texture.fromFrame('cell.close'), MINE_SIZE, MINE_SIZE);
    this.interactive = true;
  }
}

export default class Field extends mixin(Stage, EventEmitter2) {
  constructor(fieldWidth, fieldHeight) {
    super(0x888888)
    EventEmitter2.apply(this)

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
      this.emit('click:twin', this.getHoveredCellPosition())
    } else if (this.isMouseLeftDown) {
      this.emit('click:left', this.getHoveredCellPosition())
    }
    this.isMouseLeftDown = false
  }

  /**
   * @override
   */
  rightup() {
    if (this.isMouseLeftDown && this.isMouseRightDown) {
      this.emit('click:twin', this.getHoveredCellPosition())
    }
    this.isMouseRightDown = false
  }

  /**
   * @override
   */
  rightdown() {
    if (!this.isMouseLeftDown) {
      this.emit('click:right', this.getHoveredCellPosition())
    }
    this.isMouseRightDown = true
  }

  update(fieldModel) {
    fieldModel.cells.forEach(cellModel => this.updateCell(cellModel))

    if (this.isMouseLeftDown) {
      const mousePosition = this.getHoveredCellPosition()
      const hoveredCellModel = fieldModel.getCell(mousePosition.x, mousePosition.y)

      if (hoveredCellModel.state === CellState.CLOSE) {
        this.setCellTexture(hoveredCellModel.x, hoveredCellModel.y, Texture.fromFrame('cell.empty'))
      }
      // 両クリックの場合、周囲も同じ判定をする
      if (this.isMouseRightDown) {
        fieldModel.getNeighborCells(hoveredCellModel).forEach(cell => {
          if (cell.state === CellState.CLOSE) {
            this.setCellTexture(cell.x, cell.y, Texture.fromFrame('cell.empty'))
          }
        })
      }
    }
  }

  setCellTexture(x, y, texture) {
    this.cells[x + y * this.fieldWidth].setTexture(texture)
  }

  updateCell(cellModel) {
    let frameName = ''
    switch (cellModel.state) {
      case CellState.OPEN:
        if (cellModel.isMine) {
          frameName = cellModel.clickedMine ? 'cell.mine_red' : 'cell.mine'
        } else if (cellModel.neighborMineCount === 0) {
          frameName = 'cell.empty'
        } else {
          frameName = `cell.number_${cellModel.neighborMineCount}`
        }
        break;
      case CellState.CLOSE:
        frameName = 'cell.close'
        break;
      case CellState.FLAG:
        frameName = 'cell.close_flag'
        break;
    }
    this.setCellTexture(cellModel.x, cellModel.y, Texture.fromFrame(frameName))
  }
}
