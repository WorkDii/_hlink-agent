import { aggregate, deleteItems } from "@directus/sdk";
import { directusClient } from "../directus";
import { pool } from "../mysql-client";
import { env } from "../env";
import { RowDataPacket } from "mysql2";
import { addDays, addYears, format, startOfDay } from "date-fns";
import pMap from "@cjs-exporter/p-map";
import {
  insertJhcisVisitdrugItemToDirectus,
  listJhcisVisitDrugItem,
} from "./sync";

function removeItemHLink(startDate: string, endDate: string) {
  return directusClient.request(
    deleteItems("visitdrug", {
      filter: {
        pcucode: { _eq: env.PCU_CODE },
        dateupdate: {
          _gte: startDate,
          _lt: endDate,
        },
      },
    })
  );
}

async function countAll(startDate: string) {
  const [{ count: countHLinkServer }] = await directusClient.request<
    { count: string }[]
  >(
    aggregate("visitdrug", {
      query: {
        filter: {
          pcucode: { _eq: env.PCU_CODE },
          dateupdate: { _gte: startDate },
        },
      },
      aggregate: { count: ["*"] },
    })
  );

  const [data] = await pool.query<(RowDataPacket & { count: Number })[]>(
    `select
      count(*) as count
    from visitdrug v
    where dateupdate >= ? and pcucode = ? and dateupdate >=?`,
    [env.DRUG_SYNC_START_DATE, env.PCU_CODE, startDate]
  );
  if (parseInt(countHLinkServer) !== data[0].count) {
    console.log(`countAll jhcis: ${data[0].count} hlink: ${countHLinkServer}`);
    await countMonth(startDate);
  }
}

async function countMonth(startDate: string) {
  const [jhcisData] = await pool.query<
    (RowDataPacket & {
      year: number;
      month: number;
      count: Number;
    })[]
  >(
    `select YEAR(dateupdate) as year, MONTH(dateupdate) as month, count(*) as count
    from visitdrug v
    where dateupdate >= ? and pcucode = ? and dateupdate >=?
    group by YEAR(dateupdate), MONTH(dateupdate)`,
    [env.DRUG_SYNC_START_DATE, env.PCU_CODE, startDate]
  );
  await pMap(
    jhcisData,
    async (jD) => {
      const startDateOfThisMonth = `${jD.year}-${jD.month
        .toString()
        .padStart(2, "0")}-01`;
      const startDateOfNextMonth = `${jD.year}-${(jD.month + 1)
        .toString()
        .padStart(2, "0")}-01`;
      const hlinkData = await directusClient.request<
        {
          count: string;
        }[]
      >(
        aggregate("visitdrug", {
          query: {
            filter: {
              pcucode: { _eq: env.PCU_CODE },
              dateupdate: {
                _gte: startDateOfThisMonth,
                _lt: startDateOfNextMonth,
              },
            },
          },
          aggregate: { count: ["*"] },
        })
      );
      if (parseInt(hlinkData[0].count) !== jD.count) {
        console.log(
          `countMonth ${startDateOfThisMonth} jhcis: ${jD.count}  hlink: ${hlinkData[0].count}`
        );
        await countDay(startDateOfThisMonth, startDateOfNextMonth, startDate);
      }
    },
    { concurrency: 1 }
  );
}
async function countDay(
  startDateOfThisMonth: string,
  startDateOfNextMonth: string,
  startDate: string
) {
  const [jhcisData] = await pool.query<
    (RowDataPacket & {
      dateupdate: Date;
      count: Number;
    })[]
  >(
    `select DATE(dateupdate) as dateupdate, count(*) as count
    from visitdrug v
    where dateupdate >= ? and pcucode = ? and dateupdate >= ? and dateupdate >= ? and dateupdate < ?
    group by DATE(dateupdate)`,
    [
      env.DRUG_SYNC_START_DATE,
      env.PCU_CODE,
      startDate,
      startDateOfThisMonth,
      startDateOfNextMonth,
    ]
  );
  await pMap(
    jhcisData,
    async (jD) => {
      const thisDate = format(jD.dateupdate, "yyyy-MM-dd");
      const nextDate = format(addDays(jD.dateupdate, 1), "yyyy-MM-dd");

      const hlinkData = await directusClient.request<
        {
          count: string;
        }[]
      >(
        aggregate("visitdrug", {
          query: {
            filter: {
              pcucode: { _eq: env.PCU_CODE },
              dateupdate: {
                _gte: thisDate,
                _lt: nextDate,
              },
            },
          },
          aggregate: { count: ["*"] },
        })
      );
      if (parseInt(hlinkData[0].count) !== jD.count) {
        console.log(
          `countDay ${thisDate} jhcis: ${jD.count}  hlink: ${hlinkData[0].count}`
        );
        await removeItemHLink(thisDate, nextDate);
        const visitdate = await listJhcisVisitDrugItem(thisDate, nextDate);
        await insertJhcisVisitdrugItemToDirectus(visitdate);
      }
    },
    { concurrency: 1 }
  );
}

const oneYearAgo = format(startOfDay(addYears(new Date(), -1)), "yyyy-MM-dd");
countAll(oneYearAgo)
  .then(() => {
    console.log("done");
  })
  .catch((e) => {
    console.error(e);
  });
