/**
 * 第一引数で指定したクラスに第二匹数以降のクラスのプロトタイプを合成したクラスを返す。
 * @param  {function}    parent 合成元のクラス
 * @param  {...function} mixins 合成するクラス
 * @return {function}           合成されたクラス。parentのプロトタイプにmixinのメソッドを追加したもの
 */
export default function mixin(parent, ...mixins) {
  class Mixed extends parent {}
  for (let mixin of mixins) {
    for (let prop of Object.keys(mixin.prototype)) {
      Mixed.prototype[prop] = mixin.prototype[prop]
    }
  }
  return Mixed
}
