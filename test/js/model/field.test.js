import assert from 'power-assert'
import sinon from 'sinon'

import Field from '../../../src/js/model/field.js'
import * as CellState from '../../../src/js/const/cellstate.js'

describe('Model/Field', () => {
  describe('#constructor', () => {
    const width = 3
    const height = 4

    it('should set properties.', () => {
      let field = new Field(width, height)

      assert(field.width === width)
      assert(field.height === height)
      assert(field.mineCount === 0)

      assert(field.cells.length === width * height)
      field.cells.forEach((cell, i) => {
        assert(cell.x === i % width)
        assert(cell.y === Math.floor(i / width))
        assert(cell.isMine === false)
        assert(cell.state === CellState.CLOSE)
      })
    })
  })

  describe('#setMines', () => {
    const width = 3
    const height = 4
    const isMineArray = [
      true, false, true,
      false, false, false,
      false, true, false,
      true, true, false
    ]

    it("should change cell's isMine state.", () => {
      let field = new Field(width, height)
      field.setMines(isMineArray)

      assert(field.mineCount === 5)

      isMineArray.forEach((isMine, i) => {
        assert(field.cells[i].isMine === isMine)
      })
    })

    it("should set cell's neighborMineCount.", () => {
      let field = new Field(width, height)
      field.setMines(isMineArray)

      assert(field.cells[0].neighborMineCount === 0)
      assert(field.cells[1].neighborMineCount === 2)
      assert(field.cells[2].neighborMineCount === 0)
      assert(field.cells[3].neighborMineCount === 2)
      assert(field.cells[4].neighborMineCount === 3)
      assert(field.cells[5].neighborMineCount === 2)
    })

    it('should throw error with invalid length.', () => {
      let field = new Field(4, height, isMineArray)
      try {
        field.setMines(isMineArray)
        assert(false)
      } catch (e) {
        assert(e.message === 'isMineArray.length !== width * height')
      }
    })
  })

  describe('#getCell', () => {
    const width = 3
    const height = 4
    const isMineArray = [
      true, false, true,
      false, false, false,
      false, true, false,
      true, true, false
    ]

    it('should get cell.', () => {
      let field = new Field(width, height)
      field.setMines(isMineArray)

      let cell = field.getCell(1, 2)
      assert(cell === field.cells[7])
      assert(cell.x === 1)
      assert(cell.y === 2)
      assert(cell.isMine === true)
    })

    it('should get null when arguments are invalid points.', () => {
      let field = new Field(width, height)
      field.setMines(isMineArray)

      assert(field.getCell(-1, 2) === null)
      assert(field.getCell(1, -1) === null)
      assert(field.getCell(3, 2) === null)
      assert(field.getCell(1, 4) === null)
    })
  })

  describe('#getNeighborCells', () => {
    const width = 3
    const height = 4
    const isMineArray = [
      true, false, true,
      false, false, false,
      false, true, false,
      true, true, false
    ]
    it('should return neighbor cells.', () => {
      let field = new Field(width, height)
      field.setMines(isMineArray)
      let cell = field.getCell(1, 1)
      let neighbors = field.getNeighborCells(cell)

      assert(neighbors.length === 8)
      assert(neighbors[0] === field.getCell(0, 0))
      assert(neighbors[1] === field.getCell(1, 0))
      assert(neighbors[2] === field.getCell(2, 0))
      assert(neighbors[3] === field.getCell(0, 1))
      assert(neighbors[4] === field.getCell(2, 1))
      assert(neighbors[5] === field.getCell(0, 2))
      assert(neighbors[6] === field.getCell(1, 2))
      assert(neighbors[7] === field.getCell(2, 2))
    })
    it('should return valid neighbor cells when cell position is corner.', () => {
      let field = new Field(width, height)
      field.setMines(isMineArray)
      let cell = field.getCell(2, 3)
      let neighbors = field.getNeighborCells(cell)

      assert(neighbors.length === 3)
      assert(neighbors[0] === field.getCell(1, 2))
      assert(neighbors[1] === field.getCell(2, 2))
      assert(neighbors[2] === field.getCell(1, 3))

      cell = field.getCell(0, 0)
      neighbors = field.getNeighborCells(cell)
      assert(neighbors.length === 3)
      assert(neighbors[0] === field.getCell(1, 0))
      assert(neighbors[1] === field.getCell(0, 1))
      assert(neighbors[2] === field.getCell(1, 1))
    })
  })

  describe('#openCell', () => {
    const width = 3
    const height = 4
    context("opening cell which NeighborMineCount isn't 0.", () => {
      const isMineArray = [
        true, false, true,
        false, false, false,
        false, true, false,
        true, true, false
      ]
      it('should change cell state to open.', () => {
        let field = new Field(width, height)
        field.setMines(isMineArray)
        field.openCell(1, 1)

        let cell = field.getCell(1, 1)
        assert(cell.state === CellState.OPEN)
      })

      it('should emit change:cell event with target cell', () => {
        let field = new Field(width, height)
        field.setMines(isMineArray)

        let cb = sinon.spy()
        field.on('change:cell', cb)
        field.openCell(1, 2)

        assert(cb.calledOnce)
        assert(cb.firstCall.args[0] === field.getCell(1, 2))
      })

      it("shouldn't do anything when opening opened cell.", () => {
        let field = new Field(width, height)
        field.setMines(isMineArray)
        field.openCell(1, 2)

        let cb = sinon.spy()
        field.on('change:cell', cb)
        field.openCell(1, 2)
        assert(!cb.called)
      })

      it("shouldn't do anything when opening flag cell.", () => {
        let field = new Field(width, height)
        field.setMines(isMineArray)
        field.setFlag(1, 2, true)

        let cb = sinon.spy()
        field.on('change:cell', cb)
        field.openCell(1, 2)
        assert(!cb.called)
        assert(field.getCell(1, 2).state === CellState.FLAG)
      })
    })

    context('opening cell which NeighborMineCount is 0.', () => {
      const isMineArray = [
        true, false, true,
        false, false, false,
        false, false, false,
        true, false, false
      ]

      it('should change neighbor cells state to open.', () => {
        let field = new Field(width, height)
        field.setMines(isMineArray)
        field.openCell(2, 3)

        assert(field.getCell(2, 3).state === CellState.OPEN)
        assert(field.getCell(1, 3).state === CellState.OPEN)
        assert(field.getCell(2, 2).state === CellState.OPEN)
        assert(field.getCell(1, 2).state === CellState.OPEN)
        assert(field.getCell(2, 1).state === CellState.OPEN)
        assert(field.getCell(1, 1).state === CellState.OPEN)
      })

      it('should emit change:cell event for all changed cells.', () => {
        let field = new Field(width, height)
        field.setMines(isMineArray)

        let cb = sinon.spy()
        field.on('change:cell', cb)
        field.openCell(2, 3)

        assert(cb.callCount === 6)
        assert(cb.args[0][0] === field.getCell(2, 3))
        assert(cb.args[1][0] === field.getCell(1, 3))
        assert(cb.args[2][0] === field.getCell(2, 2))
        assert(cb.args[3][0] === field.getCell(1, 2))
        assert(cb.args[4][0] === field.getCell(2, 1))
        assert(cb.args[5][0] === field.getCell(1, 1))
      })
    })
  })

  describe('#setFlag', () => {
    const width = 3
    const height = 4
    const isMineArray = [
      true, false, true,
      false, false, false,
      false, true, false,
      true, true, false
    ]

    it('should change cell flag state.', () => {
      let field = new Field(width, height)
      field.setMines(isMineArray)
      field.setFlag(1, 2, true)
      assert(field.getCell(1, 2).state === CellState.FLAG)

      field.setFlag(1, 2, false)
      assert(field.getCell(1, 2).state === CellState.CLOSE)
    })

    it('should emit change:cell event with target cell.', () => {
      let field = new Field(width, height)
      field.setMines(isMineArray)
      let cb = sinon.spy()
      field.on('change:cell', cb)

      field.setFlag(1, 2, true)
      assert(cb.calledOnce)
      assert(cb.firstCall.args[0] === field.getCell(1, 2))
    })

    it("shouldn't do anything when cell is opened.", () => {
      let field = new Field(width, height)
      field.setMines(isMineArray)
      field.openCell(1, 2)
      let cb = sinon.spy()
      field.on('change:cell', cb)

      field.setFlag(1, 2, true)
      assert(field.getCell(1, 2).state === CellState.OPEN)
      assert(!cb.called)
    })
  })

  describe('#getOpenCellCount', () => {
    const width = 3
    const height = 4
    const isMineArray = [
      true, false, true,
      false, false, false,
      false, true, false,
      true, true, false
    ]

    it('should return count of open cells.', () => {
      let field = new Field(width, height)
      field.setMines(isMineArray)
      assert(field.getOpenCellCount() === 0)

      field.openCell(0, 1)
      assert(field.getOpenCellCount() === 1)

      field.openCell(1, 0)
      assert(field.getOpenCellCount() === 2)

      field.openCell(0, 1)
      assert(field.getOpenCellCount() === 2)
    })
  })
})
