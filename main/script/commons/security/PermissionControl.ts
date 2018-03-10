/**
 * 权限控制。对项目中必要的部分进行权限控制，如：场景加载、页面跳转等
 */
export default class PermissionControl {
    
    /**
     * 判断指定用户是否具有加载对应场景的权限
     * @param sceneName 需要加载的场景名
     * @param user 需要进入场景的用户，如果没指定则默认为当前用户
     * @returns 如果用户没有权限则返回false, 如果拥有权限则返回ture
     */
    static canLoadScene(sceneName: string, user?: Object): boolean {
        //TODO 2017/11/20 进行具体的权限控制实现
        return true;
    }
}