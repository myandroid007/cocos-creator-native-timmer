import BaseElem from './BaseElem';

const {ccclass, property} = cc._decorator;


/**
 * 不可移动类元素基类
 */
@ccclass
export default class UnmovableElem extends BaseElem {


    isCanMove : boolean = false;

    //测试

}

