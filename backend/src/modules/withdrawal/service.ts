import { MedusaService } from "@medusajs/framework/utils";
import Withdrawal from "./models/withdrawal";

class WithdrawalModuleService extends MedusaService({ Withdrawal }) {}

export default WithdrawalModuleService;
