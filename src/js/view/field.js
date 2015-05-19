import {Texture, Sprite, Container} from 'pixi.js'
import {range} from 'lodash'

import * as CellState from '../const/cellstate'

const MINE_SIZE = 16

/**
 * セルのビュー
 * @constructor
 */
class Cell extends Sprite {
  constructor() {
    super(Texture.fromFrame('cell.close'), MINE_SIZE, MINE_SIZE)
  }
}

/**
 * フィールドのビュー
 * @constructor
 * @param  {number} fieldWidth  フィールドの幅
 * @param  {number} fieldHeight フィールドの高さ
 */
export default class Field extends Container {
  constructor(fieldWidth, fieldHeight) {
    super(0x888888)

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
    this._initEvents()

    this.mousePosition = null
  }

  /**
   * @private
   * @return {void}
   */
  _initEvents() {
    this.interactive = true
    this.on('mousemove', (e) => {
      this.mousePosition = this._getHoveredCellPosition(e.data)
      if (this.mousePosition.x < 0 || this.mousePosition.x >= this.fieldWidth || this.mousePosition.y < 0 || this.mousePosition.y >= this.fieldHeight) {
        this.mousePosition = null
        this.isMouseLeftDown = false
        this.isMouseRightDown = false
      }
    })
    this.on('mousedown', () => {
      this.isMouseLeftDown = true
    })

    this.on('mouseup', (e) => {
      if (this.isMouseLeftDown && this.isMouseRightDown) {
        this.emit('click:twin', this._getHoveredCellPosition(e.data))
      } else if (this.isMouseLeftDown) {
        this.emit('click:left', this._getHoveredCellPosition(e.data))
      }
      this.isMouseLeftDown = false
    })

    this.on('rightup', (e) => {
      if (this.isMouseLeftDown && this.isMouseRightDown) {
        this.emit('click:twin', this._getHoveredCellPosition(e.data))
      }
      this.isMouseRightDown = false
    })

    this.on('rightdown', (e) => {
      if (!this.isMouseLeftDown) {
        this.emit('click:right', this._getHoveredCellPosition(e.data))
      }
      this.isMouseRightDown = true
    })
  }

  /**
   * マウスホバーしているセルの座標を取得する
   * @private
   * @param {InteractionData} data イベントハンドラから得られるInteractionDataのインスタンス
   * @return {{x:number, y:number}} マウスホバーしている座標
   */
  _getHoveredCellPosition(data) {
    const mousePosition = data.getLocalPosition(this)
    return {
      x: Math.floor(mousePosition.x / MINE_SIZE),
      y: Math.floor(mousePosition.y / MINE_SIZE)
    }
  }


  /**
   * ビューの更新を行う
   * @param  {FieldModel} fieldModel フィールドのモデル
   * @return {void}
   */
  update(fieldModel) {
    fieldModel.cells.forEach(cellModel => this.updateCell(cellModel))

    if (this.isMouseLeftDown && this.mousePosition) {
      const mousePosition = this.mousePosition
      const hoveredCellModel = fieldModel.getCell(mousePosition.x, mousePosition.y)

      if (hoveredCellModel.state === CellState.CLOSE) {
        this._setCellTexture(hoveredCellModel.x, hoveredCellModel.y, Texture.fromFrame('cell.empty'))
      }
      // 両クリックの場合、周囲も同じ判定をする
      if (this.isMouseRightDown) {
        fieldModel.getNeighborCells(hoveredCellModel).forEach(cell => {
          if (cell.state === CellState.CLOSE) {
            this._setCellTexture(cell.x, cell.y, Texture.fromFrame('cell.empty'))
          }
        })
      }
    }
  }

  /**
   * 指定した座標のセルのテクスチャをセットする
   * @private
   * @param  {number}       x       x座標
   * @param  {number}       y       y座標
   * @param  {PIXI.Texture} texture セットするテクスチャ
   * @return {void}
   */
  _setCellTexture(x, y, texture) {
    this.cells[x + y * this.fieldWidth].texture = texture
  }

  /**
   * 指定したセルのビューの更新を行う
   * @param  {CellModel} cellModel セルのモデル
   * @return {void}
   */
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
        break
      case CellState.CLOSE:
        frameName = 'cell.close'
        break
      case CellState.FLAG:
        frameName = 'cell.close_flag'
        break
    }
    this._setCellTexture(cellModel.x, cellModel.y, Texture.fromFrame(frameName))
  }
}
