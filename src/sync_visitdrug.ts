import { env } from "./env";
import cron from "node-cron";
import { pool } from "./mysql-client";
import { QueryResult, RowDataPacket } from "mysql2";

const DEFAULT_SCHEDULE = "30 * * * *";

type VisitDrug = RowDataPacket & {
  visitno: number;
  drugcode: string;
  costprice: string;
  realprice: string;
  dateupdate: Date;
  pcucode: string;
  unit: number;
};
async function visitdrug2hlink() {
  try {
    const data = await pool.query<VisitDrug[]>(
      `select visitno, drugcode, costprice, realprice, dateupdate, pcucode, unit from visitdrug v where dateupdate >= ?  limit 2`,
      [env.DRUG_SYNC_START_DATE]
    );
    console.log(data[0]);
    data[0].forEach((d) => {});
  } catch (error) {
    console.log(error);
  }
}

export function startSync() {
  console.log("start sync visitdrug", new Date());
  visitdrug2hlink();
  // cron.schedule(env.DRUG_SYNC_SCHEDULE || DEFAULT_SCHEDULE, () => {
  //   console.log("running a task every minute", new Date());
  // });
}
