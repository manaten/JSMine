import EventEmitter from 'eventemitter3'
import {range, zipWith} from 'lodash'

import * as CellState from '../const/cellstate'

/**
 * マインスイーパのセル
 * @constructor
 * @param {number} x セルのx座標
 * @param {number} y セルのy座標
 */
export class Cell {
  constructor(x, y) {
    this.x = x
    this.y = y

    this.isMine = false
    this.clickedMine = false
    this.state = CellState.CLOSE
    this.neighborMineCount = 0
  }
}


/**
 * マインスイーパの盤面モデル
 * @constructor
 * @param {number} width  盤面の幅
 * @param {number} height 盤面の高さ
 */
export default class Field extends EventEmitter {
  constructor(width, height) {
    super()

    this.width = width
    this.height = height
    this.mineCount = 0

    this.cells = range(width * height).map((i) => {
      let x = i % width
      let y = Math.floor(i / width)
      return new Cell(x, y)
    })
  }

  /**
   * 譜面の地雷状況を真偽値の配列を渡すことで設定する
   * @param {Array.<boolean>} isMineArray 地雷であればtrueのwidth*heightの長さの配列
   * @return {void}
   */
  setMines(isMineArray) {
    if (isMineArray.length !== this.cells.length) {
      throw new Error('isMineArray.length !== width * height')
    }
    this.mineCount = isMineArray.filter(isMine => isMine).length
    zipWith(this.cells, isMineArray, (cell, isMine) => {
      cell.isMine = isMine
    })
    this.cells.forEach(cell => {
      cell.neighborMineCount = this.getNeighborCells(cell).filter(cell => cell.isMine).length
    })
  }

  /**
   * 指定した座標のセルを取得する
   * @param  {number} x x座標
   * @param  {number} y y座標
   * @return {?Cell}  取得できた場合Cellオブジェクトオブジェクト
   */
  getCell(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null
    }
    return this.cells[x + this.width * y]
  }

  /**
   * 指定したセルの周囲のセルを取得する
   * @param  {Cell} cell    指定するセル
   * @return {Array.<Cell>} 周囲のセルの配列
   */
  getNeighborCells(cell) {
    return [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0], [1, 0],
      [-1, 1], [0, 1], [1, 1]
    ]
    .map(point => this.getCell(cell.x + point[0], cell.y + point[1]))
    .filter(cell => cell !== null)
  }

  /**
   * 指定した座標のセルを開く
   * @param  {number} x x座標
   * @param  {number} y y座標
   * @return {void}
   */
  openCell(x, y) {
    let targetCells = []
    targetCells.push(this.getCell(x, y))

    while (targetCells.length > 0) {
      let cell = targetCells.pop()
      if (cell.state === CellState.CLOSE) {
        cell.state = CellState.OPEN
        this.emit('change:cell', cell)
        // セルが地雷ではなく、周囲のセルに地雷がなかった場合は、周囲のセルも開く。
        if (!cell.isMine && cell.neighborMineCount === 0) {
          targetCells.push.apply(targetCells, this.getNeighborCells(cell))
        }
      }
    }
  }

  /**
   * 指定した座標の旗状態を変更する
   * @param {number}  x         x座標
   * @param {number}  y         y座標
   * @param {boolean} flagState 旗を立てる場合はtrue
   * @return {void}
   */
  setFlag(x, y, flagState) {
    const cell = this.getCell(x, y)
    if (cell.state === CellState.OPEN) {
      // 開いてるセルには何もしない
      return
    }
    cell.state = flagState ? CellState.FLAG : CellState.CLOSE
    this.emit('change:cell', cell)
  }

  /**
   * 開いているセルの数を取得する。
   * @return {number} 開いているセルの数
   */
  getOpenCellCount() {
    return this.cells.filter(cell => cell.state === CellState.OPEN).length
  }
}
