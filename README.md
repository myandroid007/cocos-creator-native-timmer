# assets

##  -----中文----------
- 1、编写目的
  ```
  因原生js 在切换页面，如手机app 显示桌面时，js线程被暂停，故定时器也被暂停，有时项目要求此环境下js定时器也要继续运行。可以考虑以此方式来实现
  ```
- 2、软件要求
  ```
    cocos creator
  ```
- 3、语言
  ```
  typeScript  或者 javaScript
  ```

- 4、使用
  ```
  查看assets/script/commonTimmer.ts 即可
  ```
  >4.1  导入文件  
  ```
   import CommonTimmer from "./CommonTimmer";
  ```
  >4.2  使用时，直接调用对应方法：
  ```
      定时器id = CommonTimmer. 定时器方法（间隔执行时间， 回调函数， 延迟执行时间？选传）
  
      timmer1Id = CommonTimmer.setTimeout(1000, callBack);


//-----English -------
