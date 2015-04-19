import PIXI from 'pixi.js'
import raf from 'raf'
import getParameter from'get-parameter'

import FieldView from './view/field'
import GameModel from './model/game'

function init() {
  const width = getParameter('width') || 20
  const height = getParameter('height') || 10
  const mineNum = getParameter('mine') || 30

  const gameModel = new GameModel(width, height, mineNum)
  const fieldView = new FieldView(width, height)
  fieldView.on('click:left', position => {
    gameModel.leftClick(position.x, position.y)
  })
  fieldView.on('click:right', position => {
    gameModel.rightClick(position.x, position.y)
  })
  fieldView.on('click:twin', position => {
    gameModel.twinClick(position.x, position.y)
  })
  gameModel.on('finish:complete', position => {
    window.alert('ゲームクリア!')
  })

  const renderer = PIXI.autoDetectRenderer(fieldView.width, fieldView.height)
  renderer.view.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  }, false)
  document.body.appendChild(renderer.view)

  const draw = () => {
    fieldView.update(gameModel.field.cells)
    renderer.render(fieldView)
    raf(draw)
  }
  draw()
}

window.addEventListener('load', () => {
  const loader = new PIXI.AssetLoader([
    './assets/mine.json'
  ])
  loader.onComplete = init
  loader.load()
})