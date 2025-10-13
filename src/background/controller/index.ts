import { registerBGFun, callBGFun } from "@/utils/BGServerRegister";
import { setStorePlusProxy, debounceRemoveRules } from "@/background/service/ApiRegisterHelper"
import { closeTimerOperator } from '@/background/helper/TabHelper'
import FunApi from "@/background/controller/FunApi";

registerBGFun(FunApi.setStorePlus, setStorePlusProxy);
registerBGFun(FunApi.debounceRemoveRules, debounceRemoveRules);
registerBGFun(FunApi.getSessionCloseNumber, () => closeTimerOperator.getSessionCloseNumber());