import BaseElem from './BaseElem';

const {ccclass, property} = cc._decorator;

/**
 * 可移动，可销毁类元素的 基类
 */
@ccclass
export default class MovableElem extends BaseElem {


    isCanMove : boolean = true;


}

