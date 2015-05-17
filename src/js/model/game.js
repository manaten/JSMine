import Field from './field.js'
import {chain} from 'lodash'
import EventEmitter from 'eventemitter3'


import * as CellState from '../const/cellstate'

const FINISH_STATE_FAIL = 'fail'
const FINISH_STATE_COMPLETE = 'complete'

/**
 * マインスイーパのゲームのモデル。
 * 左クリック･右クリック･両クリックそれぞれに対して、適切に譜面の状態操作を行う。
 * @constructor
 * @param {number} width  盤面の幅
 * @param {number} height 盤面の高さ
 */
export default class Game extends EventEmitter {
  constructor(width, height, mineCount) {
    super()

    this.field = new Field(width, height)

    this.isFirst = true
    this.finishState = null

    if (mineCount > width * height - 1) {
      mineCount = width * height - 1
    }
    this.mineCount = mineCount
  }

  /**
   * @private
   * @param  {number}          startX 開始地点のX座標
   * @param  {number}          startY 開始地点のY座標
   * @return {Array.<boolean>} width * height サイズの各マスが地雷かどうかを表す配列
   */
  _createMineArray(startX, startY) {
    let isMineArray = chain(this.field.width * this.field.height - 1)
      .range()
      .map(n => n < this.mineCount)
      .shuffle()
      .run()
    isMineArray.splice(startX + this.field.width * startY, 0, false)
    return isMineArray
  }

  /**
   * @private
   * @return {void}
   */
  _checkFinish() {
    if (this.finishState !== null) {
      return
    }
    if (this.field.getOpenCellCount() === this.field.width * this.field.height - this.mineCount) {
      this.finishState = FINISH_STATE_COMPLETE
      this.emit('finish:complete')
    }
  }

  /**
   * @private
   * @return {void}
   */
  _finishByFail() {
    this.finishState = FINISH_STATE_FAIL
    this.field.cells.forEach(cell => {
      if (cell.isMine && !cell.open) {
        this.field.openCell(cell.x, cell.y)
      }
    })

    this.emit('finish:fail')
  }

  /**
   * 左クリック時の挙動を行う
   * @param {number} x クリックするx座標
   * @param {number} y クリックするy座標
   * @return {void}
   */
  leftClick(x, y) {
    if (this.finishState !== null) {
      return
    }

    // 初回クリック時のみ、地雷を生成する
    if (this.isFirst) {
      this.isFirst = false
      this.field.setMines(this._createMineArray(x, y))
    }

    const cell = this.field.getCell(x, y)
    if (cell.state !== CellState.CLOSE) {
      return
    }
    this.field.openCell(x, y)
    if (cell.isMine) {
      cell.clickedMine = true
      this._finishByFail()
      return
    }
    this._checkFinish()
  }

  /**
   * 右クリック時の挙動を行う
   * @param {number} x クリックするx座標
   * @param {number} y クリックするy座標
   * @return {void}
   */
  rightClick(x, y) {
    if (this.finishState !== null) {
      return
    }
    const cell = this.field.getCell(x, y)
    if (cell.state === CellState.OPEN) {
      return
    }
    this.field.setFlag(x, y, cell.state !== CellState.FLAG)
  }

  /**
   * 両方クリック時の挙動を行う
   * @param {number} x クリックするx座標
   * @param {number} y クリックするy座標
   * @return {void}
   */
  twinClick(x, y) {
    if (this.finishState !== null || this.isFirst) {
      return
    }
    const cell = this.field.getCell(x, y)
    const neighborCells = this.field.getNeighborCells(cell)
    const flagCount = neighborCells.filter(cell => cell.state === CellState.FLAG).length
    if (cell.state !== CellState.OPEN ||
        cell.neighborMineCount !== flagCount
    ) {
      return
    }
    neighborCells
    .filter(cell => cell.state !== CellState.FLAG)
    .forEach(cell => {
      this.field.openCell(cell.x, cell.y)
      if (cell.isMine) {
        cell.clickedMine = true
        this.finishState = FINISH_STATE_FAIL
      }
    })
    if (this.finishState === FINISH_STATE_FAIL) {
      this._finishByFail()
      return
    }
    this._checkFinish()
  }
}

