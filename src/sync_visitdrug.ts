import { env } from "./env";
import { pool } from "./mysql-client";
import { RowDataPacket } from "mysql2";
import { directusClient } from "./directus";
import { createItem, deleteItems, readItems } from "@directus/sdk";
import { format } from "date-fns";
import cron from "node-cron";

const DEFAULT_SCHEDULE = "30 * * * *";

type VisitDrug = RowDataPacket & {
  visitno: number;
  drugcode: string;
  costprice: string;
  realprice: string;
  dateupdate: Date;
  pcucode: string;
  unit: number;
  drugcode24?: string;
  drugtype: string;
};

async function insetItemToDirectus(data: VisitDrug[]) {
  return await Promise.all(
    data.map(async (d, i) => {
      // check if drugcode24 is exist fine hospital_drug id
      if (d.drugcode24) {
        const hospitalDrug = await directusClient.request<{ id: string }[]>(
          readItems("hospital_drug", {
            filter: { drugcode24: { _eq: d.drugcode24 } },
            fields: ["id"],
          })
        );
        d.hospital_drug = hospitalDrug.length ? hospitalDrug[0].id : null;
      }
      await directusClient.request(
        deleteItems("visitdrug", {
          filter: {
            _and: [
              { visitno: { _eq: d.visitno } },
              { drugcode: { _eq: d.drugcode } },
              { pcucode: { _eq: d.pcucode } },
            ],
          },
        })
      );
      const inserted = await directusClient.request(createItem("visitdrug", d));
      console.log("inserted", inserted, `index: ${i + 1}/${data.length}`);
      return inserted;
    })
  );
}
async function jhcis2hlink() {
  try {
    const hlinkData = await directusClient.request<{ dateupdate: string }[]>(
      readItems("visitdrug", {
        sort: ["-dateupdate"],
        limit: 1,
        fields: ["dateupdate"],
      })
    );
    if (hlinkData.length) {
      const lastDateUpdate = hlinkData[0].dateupdate;
      const jhcisData = await pool.query<VisitDrug[]>(
        `select
          visitno, v.drugcode, costprice, realprice, dateupdate, pcucode, unit, c.drugcode24, c.drugtype
        from visitdrug v
          left join cdrug c on c.drugcode = v.drugcode
        where dateupdate >= ?  and dateupdate >= ?`,
        [env.DRUG_SYNC_START_DATE, format(lastDateUpdate, "yyyy-MM-dd HH:mm")]
      );
      await insetItemToDirectus(jhcisData[0]);
      console.log("finish");
    } else {
      const jhcisData = await pool.query<VisitDrug[]>(
        `select
          visitno, v.drugcode, costprice, realprice, dateupdate, pcucode, unit, c.drugcode24, c.drugtype
        from visitdrug v
          left join cdrug c on c.drugcode = v.drugcode
        where dateupdate >= ?`,
        [env.DRUG_SYNC_START_DATE]
      );
      await insetItemToDirectus(jhcisData[0]);
      console.log("finish");
    }
  } catch (error) {
    console.log(error);
  }
}

export function startSync() {
  console.log("start sync visitdrug", new Date());
  const schedule = env.DRUG_SYNC_SCHEDULE || DEFAULT_SCHEDULE;
  cron.schedule(schedule, () => {
    console.log(`running a task every ${schedule} NOW IS `, new Date());
    jhcis2hlink();
  });
}
