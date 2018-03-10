const {ccclass, property} = cc._decorator;

/**
 * 弹框按钮
 */
type Button = {
    /**
     * 按钮上面的文本
     */
    text: string,
    
    /**
     * 点击按钮时执行的方法
     */
    onPress: (() => void) | string
}

@ccclass
export default class Alert {
    /**
     * 显示弹出框
     * 
     * @param title 弹出框标题
     * @param message 弹出框信息
     * @param buttons 弹出框按钮
     */
    public static alert(title: string, message: string, buttons: Array<Button>) {
        if (cc.sys.os !== cc.sys.OS_ANDROID) return;
        jsb.reflection.callStaticMethod('com/retugame/commons/ui/Alert','alert',
        '(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V', 
        title, message, this._getApdaptedButtons(buttons));
    }

    /**
     * 获取适合Java回调的JavaScript按钮的字符串
     * 
     * @param buttons 需要转换的按钮
     */
    private static _getApdaptedButtons(buttons: Array<Button>): string {
        let buttonPositive = buttons.pop();
        let buttonNegative = buttons.pop();
        let buttonNeutral = buttons.pop();

        let rstButtons: Array<Button> = [];
        if (!!buttonPositive) {
            (<any>cc).onPositiveAlertBtn = buttonPositive.onPress;
            let rstButton: Button = {
                text: buttonPositive.text,
                onPress: 'cc.onPositiveAlertBtn()', 
            }
            rstButtons.push(rstButton);
        }
        if (!!buttonNegative) {
            (<any>cc).onNegativeAlertBtn = buttonNegative.onPress;
            let rstButton: Button = {
                text: buttonNegative.text,
                onPress: 'cc.onNegativeAlertBtn()', 
            }
            rstButtons.push(rstButton);
        }
        if (!!buttonNeutral) {
            (<any>cc).onNeutralAlertBtn = buttonNeutral.onPress;
            let rstButton: Button = {
                text: buttonNeutral.text,
                onPress: 'cc.onNeutralAlertBtn()', 
            }
            rstButtons.push(rstButton);
        }

        return JSON.stringify(rstButtons);
    }
}