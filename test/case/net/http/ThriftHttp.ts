import ClientFactory, {ClientType} from '../../../../main/Script/commons/net/ClientFactory';
import CalculatorClient from './Calculator';
import PlayerClient from '../../../../main/script/client/Player';
const {ccclass, property, executionOrder} = cc._decorator;


@ccclass
@executionOrder(1)
export default class ThriftHttp extends cc.Component {

    @property(cc.EditBox)
    input1: cc.EditBox = null;
    @property(cc.EditBox)
    input2: cc.EditBox = null;
    @property(cc.Button)
    calculateBtn: cc.Button = null;
    @property(cc.Label)
    result: cc.Label = null;

    onLoad() {
        // init logic
        // this.label.string = await this.testAsync();
    }

    plus() {
        //---------------------------Caculator----------------
        let calculatorClient: CalculatorClient = <CalculatorClient> ClientFactory.getHttpClient(CalculatorClient, 'calculator'); 
        let num1Str = this.input1.string;
        let num2Str = this.input2.string;
        if (!!num1Str && !!num2Str) {
            calculatorClient.add(parseFloat(num1Str), parseFloat(num2Str), result => {
                this.result.string = `${result}`;
            });
        }

        //---------------------------Player-------------------
        // let playerClient:  
        // let playerClient: PlayerClient = <PlayerClient> ClientFactory.getHttpClient(PlayerClient, 'player'); 
        // playerClient.matchOpponents(3, 1, 7, function (result) {
        //     // document.getElementById('opponents').innerHTML = result;
        //     cc.log(`match opponents: ${result}`);
        // });
    }
}
