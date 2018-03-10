import PermissionControl from '../security/PermissionControl';
import Global from '../storage/Global';
import {SceneRoute, CommonSceneParam} from '../../typings/entities';


/**
 * 场景导航器，提供场景之间的切换加载、返回上一场景和场景之间的数据传递等
 */
export default class SceneNavigator {
    private static _routeStack: SceneRoute[] = [];
    private static _isInit: boolean = false;

    /**
     * 初始化场景路由 
     * @param rootRoute 根路由  
     */
    static initRoute(rootRoute: SceneRoute): void {
        if (!this._isInit) {
            this._routeStack.push(rootRoute);
            this._isInit = true;
        }
    }

    private static _requireInit() {
        if (!this._isInit) {
            throw new Error('Please initialize the scene navigator first');
        }
    }

    /**
     * 将场景路由加入场景导航器并加载对应的场景 
     * @param route 需要加入到场景管理器中的路由
     * @throws 如果没有初始化，则抛出对应的异常
     */
    static push(route: SceneRoute): void {
        this._requireInit();
        if (!PermissionControl.canLoadScene(route.sceneName)) {
            !!route.onNoPermission && route.onNoPermission(`You don't have permission to access the ${route.sceneName} scene`);
            return;
        }

        // 场景加载前向场景中写入输入数据
        Global.setItem(route.sceneName, route.sceneInput);
        if (!cc.director.loadScene(route.sceneName, () => {
            //TODO 2017/11/21 实现replaceAt方法
            let existedRouteIndex = this._routeStack.findIndex(currentRoute => currentRoute.sceneName === route.sceneName);
            if (existedRouteIndex !== -1) {
                this._routeStack[existedRouteIndex] = route;
            } else {
                this._routeStack.push(route);
            }
            !!route.onLaunched && route.onLaunched();
        })) {
            Global.removeItem(route.sceneName);
        } 
    }

    /**
     * 返回上一个场景，如果只有当前一个场景则什么也不做
     * @param sceneParam 场景加载时所需的参数
     * @throws 如果没有初始化，则抛出对应的异常
     */
    static pop(sceneParam?: CommonSceneParam): void {
        this._requireInit();
        // 路由栈中至少需要保留一个路由
        if (this._routeStack.length < 2) {
            cc.log('Keep at least one scene route in the stack');    
            return;
        }
        let lastSceneRoute = this._routeStack[this._routeStack.length - 2];
        !!sceneParam && Object.assign(lastSceneRoute, sceneParam);
        this.popToRoute(lastSceneRoute);
    }

    /**
     * 返回当前栈中的第一个场景，如果当前栈中没有场景(如：没有初始化)，则什么也不做
     * @param sceneParam 场景加载时所需的参数
     * @throws 如果没有初始化，则抛出对应的异常
     */
    static popToTop(sceneParam?: CommonSceneParam): void {
        this._requireInit();
        if (this._routeStack.length < 1) {
            cc.info('The current scene stack is empty');
            return;
        }
        let firstSceneRoute = this._routeStack[0];
        !!sceneParam && Object.assign(firstSceneRoute, sceneParam);
        this.popToRoute(firstSceneRoute);
    }

    /**
     * 返回跳转到指定路由的场景
     * @param route 需要跳转的路由 
     * @throws 如果没有初始化，则抛出对应的异常
     */
    static popToRoute(route: SceneRoute): void {
        this._requireInit();
        let specifiedRoute;
        let specifiedRouteIndex = this._routeStack.findIndex(currentRoute => {
            if (currentRoute.sceneName === route.sceneName) {
                specifiedRoute = currentRoute;
                return true
            }
        });
        if (specifiedRouteIndex === -1) {
            cc.info(`The ${route.sceneName} scene that needs to go back doesn't exist`);
            return;
        }
        if (route !== specifiedRoute) {
            Object.assign(specifiedRoute, route);
        }
        this._routeStack = this._routeStack.slice(0, specifiedRouteIndex + 1);
        !!specifiedRoute.sceneInput && Global.setItem(specifiedRoute.sceneName, specifiedRoute.sceneInput);
        //TODO 2017/11/21 处理其他的场景参数
        cc.director.loadScene(specifiedRoute.sceneName, () => {
            specifiedRoute.onLaunched && specifiedRoute.onLaunched();
        });
    }

    /**
     * 返回当前场景路由
     * @returns 导航器中当前场景路由，如果没有则返回null
     */
    static peek(): SceneRoute {
        if (this._routeStack.length > 0) {
            return this._routeStack[this._routeStack.length - 1];
        }
        return null;
    }

    /**
     * 返回上一个场景路由
     * @returns 导航器中上一个场景路由，如果没有则返回null
     */
    static peekLast(): SceneRoute {
        if (this._routeStack.length > 1) {
            return this._routeStack[this._routeStack.length - 2];
        }
        return null;
    }

    /**
     * 返回场景导航器中的根路由
     * @returns 根路由，如果没有则返回null
     */
    static peekTop(): SceneRoute {
        if (this._routeStack.length > 0) {
            return this._routeStack[0];
        }
        return null;
    }

    static currentRouteNum(): number {
        return this._routeStack.length;
    }

    /**
     * 获取当前场景的输入数据
     * @returns 当前场景的数据数据
     */
    static getSceneInput(): Object {
        return Global.getItem(cc.director.getScene().name) || 
               Global.getItem(`${cc.director.getScene().name}.fire`);
    }
}